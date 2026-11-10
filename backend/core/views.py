"""
Audit log API views (admin only).
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminRole


class AuditLogView(APIView):
    """
    GET /api/core/audit/patients/{pk}/
    Returns the full change history for a patient record.
    Admin-only.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, model_name, pk):
        try:
            history = self._get_history(model_name, pk, request)
        except (LookupError, Exception) as e:
            return Response({'error': str(e)}, status=400)
        return Response(history)

    def _get_history(self, model_name, pk, request=None):
        model_map = {
            'patient': ('patients', 'Patient'),
            'appointment': ('appointments', 'Appointment'),
            'partograph': ('patients', 'PartographEntry'),
            'postnatal': ('postnatal', 'PostnatalRecord'),
        }
        if model_name not in model_map:
            raise LookupError(f'Unknown model: {model_name}. Valid: {list(model_map.keys())}')

        app, model_cls_name = model_map[model_name]
        from django.apps import apps
        Model = apps.get_model(app, model_cls_name)
        instance = Model.objects.get(pk=pk)
        history_qs = instance.history.all().order_by('-history_date')

        if request:
            from_date = request.GET.get('from_date')
            to_date = request.GET.get('to_date')
            action_type = request.GET.get('action_type')
            user_val = request.GET.get('user')

            if from_date:
                history_qs = history_qs.filter(history_date__date__gte=from_date)
            if to_date:
                history_qs = history_qs.filter(history_date__date__lte=to_date)
            if action_type:
                history_qs = history_qs.filter(history_type=action_type)
            if user_val:
                from django.db.models import Q
                history_qs = history_qs.filter(
                    Q(history_user__email__icontains=user_val) |
                    Q(history_user__full_name__icontains=user_val)
                )

        records = []
        history_list = list(history_qs)
        for i, record in enumerate(history_list):
            changes = {}
            if i < len(history_list) - 1:
                delta = record.diff_against(history_list[i + 1])
                for change in delta.changes:
                    changes[change.field] = {
                        'old': str(change.old) if change.old is not None else None,
                        'new': str(change.new) if change.new is not None else None,
                    }
            records.append({
                'history_id': record.history_id,
                'history_type': record.history_type,
                'history_date': record.history_date.isoformat(),
                'history_user': str(record.history_user) if record.history_user else 'System',
                'changes': changes,
            })
        return records


import asyncio
import json
import logging
import redis.asyncio as aioredis
from django.conf import settings
from django.http import StreamingHttpResponse, HttpResponseForbidden
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

def should_send(data, user_id, user_role, patient_id):
    event_type = data.get('event_type')
    payload = data.get('payload', {})

    if event_type == 'staff_notification':
        return str(payload.get('user_id')) == str(user_id)

    elif event_type == 'clinical_alert':
        recipient_roles = payload.get('recipient_roles', ['ADMIN', 'NURSE', 'DOCTOR'])
        return user_role in recipient_roles

    elif event_type == 'patient_message':
        if user_role == 'MOTHER':
            return patient_id is not None and str(payload.get('patient_id')) == str(patient_id)
        return user_role in ['ADMIN', 'NURSE', 'DOCTOR']

    elif event_type == 'appointment_event':
        if user_role == 'MOTHER':
            return patient_id is not None and str(payload.get('patient_id')) == str(patient_id)
        return user_role in ['ADMIN', 'NURSE', 'DOCTOR']

    return False


async def event_generator(user_id, user_role, patient_id):
    redis_url = getattr(settings, 'REDIS_URL', settings.CELERY_BROKER_URL)
    r = aioredis.from_url(redis_url)
    pubsub = r.pubsub()
    await pubsub.subscribe("maternity_realtime_events")

    try:
        last_ping_time = asyncio.get_event_loop().time()
        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    try:
                        data = json.loads(message['data'])
                        if should_send(data, user_id, user_role, patient_id):
                            yield f"data: {json.dumps(data)}\n\n"
                    except Exception as e:
                        logger.warning(f"Error parsing redis pubsub message: {e}")
            except Exception as e:
                logger.warning(f"Redis get_message failed: {e}")
                await asyncio.sleep(1.0)

            current_time = asyncio.get_event_loop().time()
            if current_time - last_ping_time >= 15.0:
                yield "data: {\"event_type\": \"ping\"}\n\n"
                last_ping_time = current_time
    finally:
        try:
            await pubsub.unsubscribe("maternity_realtime_events")
        except Exception:
            pass
        await r.close()


class RealtimeStreamView(APIView):
    """
    Server-Sent Events (SSE) stream view.
    Authenticates via JWT query parameter 'token'.
    Streams real-time events published via Aiven Redis.
    """
    permission_classes = [AllowAny]

    async def get(self, request, *args, **kwargs):
        token = request.GET.get('token')
        if not token:
            return HttpResponseForbidden("Missing auth token")

        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = await sync_to_async(jwt_auth.get_user)(validated_token)
        except AuthenticationFailed:
            return HttpResponseForbidden("Invalid or expired token")

        user_id = str(user.id)
        user_role = getattr(user, 'role', '')
        
        # Safely resolve patient relation if user is a MOTHER
        patient_id = None
        if user_role == 'MOTHER':
            patient_id = await sync_to_async(lambda: user.patient.id if user.patient else None)()

        response = StreamingHttpResponse(
            event_generator(user_id, user_role, patient_id),
            content_type="text/event-stream"
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['X-Accel-Buffering'] = 'no'
        return response


# ── Hospital Customization settings views ──────────────────────────────────────

import os
import json
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from supabase_services.storage_service import StorageService

SETTINGS_FILE_PATH = os.path.join(settings.BASE_DIR, 'config', 'hospital_settings.json')


def load_settings():
    if not os.path.exists(SETTINGS_FILE_PATH):
        default_settings = {
            "hospital_name": "Itierio Maternity and Nursing Home",
            "hospital_abbreviation": "IMNH",
            "logo_url": None,
            "login_image_url": None
        }
        os.makedirs(os.path.dirname(SETTINGS_FILE_PATH), exist_ok=True)
        try:
            with open(SETTINGS_FILE_PATH, 'w') as f:
                json.dump(default_settings, f, indent=2)
        except Exception:
            pass
        return default_settings

    try:
        with open(SETTINGS_FILE_PATH, 'r') as f:
            return json.load(f)
    except Exception:
        return {
            "hospital_name": "Itierio Maternity and Nursing Home",
            "hospital_abbreviation": "IMNH",
            "logo_url": None,
            "login_image_url": None
        }


class HospitalSettingsView(APIView):
    """
    GET /api/v1/core/hospital-settings/
    Public endpoint to retrieve current hospital branding details.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        data = load_settings()
        return Response(data)


class UpdateHospitalSettingsView(APIView):
    """
    POST /api/v1/core/hospital-settings/update/
    Admin-only endpoint to update hospital branding details and upload images.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        current_data = load_settings()

        hospital_name = request.data.get('hospital_name')
        if hospital_name is not None:
            current_data['hospital_name'] = hospital_name

        hospital_abbreviation = request.data.get('hospital_abbreviation')
        if hospital_abbreviation is not None:
            current_data['hospital_abbreviation'] = hospital_abbreviation

        # Process uploaded logo
        logo_file = request.FILES.get('logo')
        if logo_file:
            filename = logo_file.name
            file_bytes = logo_file.read()
            uploaded_path = StorageService.upload(
                bucket='documents',
                path=f"branding/logo_{filename}",
                file_bytes=file_bytes,
                filename=filename,
                upsert=True
            )
            current_data['logo_url'] = StorageService.signed_url('documents', uploaded_path)

        # Process uploaded login background image
        login_image_file = request.FILES.get('login_image')
        if login_image_file:
            filename = login_image_file.name
            file_bytes = login_image_file.read()
            uploaded_path = StorageService.upload(
                bucket='documents',
                path=f"branding/login_{filename}",
                file_bytes=file_bytes,
                filename=filename,
                upsert=True
            )
            current_data['login_image_url'] = StorageService.signed_url('documents', uploaded_path)

        # Save back to JSON configuration file
        try:
            with open(SETTINGS_FILE_PATH, 'w') as f:
                json.dump(current_data, f, indent=2)
        except Exception as exc:
            return Response({'error': f"Failed to save settings file: {exc}"}, status=500)

        return Response(current_data)


