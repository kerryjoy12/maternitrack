from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ReminderLog
from .serializers import ReminderLogSerializer, SendReminderSerializer, BulkSendReminderSerializer
from .sms_service import send_sms, build_appointment_reminder
from patients.models import Patient
from appointments.models import Appointment


class ReminderLogListView(generics.ListAPIView):
    queryset = ReminderLog.objects.select_related('patient', 'appointment').order_by('-sent_at')
    serializer_class = ReminderLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class SendReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            patient = Patient.objects.get(pk=data['patient_id'])
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)

        appointment = None
        if data.get('appointment_id'):
            try:
                appointment = Appointment.objects.get(pk=data['appointment_id'])
            except Appointment.DoesNotExist:
                pass

        # Build message
        lang = data.get('lang') or getattr(patient, 'lang', 'en')
        if data.get('use_template') and appointment:
            time_str = str(appointment.scheduled_time) if appointment.scheduled_time else None
            message = build_appointment_reminder(
                patient.full_name,
                str(appointment.scheduled_date),
                time_str,
                lang=lang
            )
        elif data.get('use_template'):
            if lang == 'sw':
                message = f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
            else:
                message = f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
        else:
            message = data.get('message') or (
                f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
                if lang == 'sw'
                else f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
            )

        phone = patient.phone_number.strip() if patient.phone_number else ""
        email = getattr(patient, 'email', None)

        if not phone and not email:
            return Response({'success': False, 'error': 'Patient has no phone number or email address'}, status=400)

        sms_success = False
        email_success = False
        sms_error = ""
        email_error = ""
        logs = []

        if phone:
            # Normalise phone to international format (+254XXXXXXXXX)
            if phone.startswith('0') and len(phone) == 10:
                phone = '+254' + phone[1:]
            elif phone.startswith('254') and not phone.startswith('+'):
                phone = '+' + phone
            elif not phone.startswith('+'):
                phone = '+254' + phone  # fallback

            # Send SMS
            result_sms = send_sms(phone, message)
            sms_success = result_sms['success']
            sms_error = result_sms.get('error', '')
            log_sms = ReminderLog.objects.create(
                patient=patient,
                appointment=appointment,
                channel='SMS',
                phone_number=phone,
                message_body=message,
                delivery_status='SENT' if sms_success else 'FAILED',
                provider='AFRICAS_TALKING',
                error_message=sms_error,
                sent_by=request.user,
            )
            logs.append(log_sms)

        elif email:
            from reminders.email_service import send_email_reminder
            result_email = send_email_reminder(email, "Upcoming Appointment Reminder", message)
            email_success = result_email['success']
            email_error = result_email.get('error', '')
            log_email = ReminderLog.objects.create(
                patient=patient,
                appointment=appointment,
                channel='EMAIL',
                email_address=email,
                message_body=message,
                delivery_status='SENT' if email_success else 'FAILED',
                provider='SMTP',
                error_message=email_error,
                sent_by=request.user,
            )
            logs.append(log_email)

        # Check overall success
        overall_success = False
        if phone:
            overall_success = sms_success
        elif email:
            overall_success = email_success

        err_msg = ""
        if not overall_success:
            err_parts = []
            if phone and not sms_success:
                err_parts.append(f"SMS: {sms_error}")
            elif email and not email_success:
                err_parts.append(f"Email: {email_error}")
            err_msg = "; ".join(err_parts)

        # Always return 200 so the frontend receives the actual error detail
        return Response({
            'success': overall_success,
            'log': ReminderLogSerializer(logs[0]).data if logs else None,
            'logs': [ReminderLogSerializer(l).data for l in logs],
            'error': err_msg,
        }, status=200)


class PreviewReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            patient = Patient.objects.get(pk=data['patient_id'])
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)

        appointment = None
        if data.get('appointment_id'):
            try:
                appointment = Appointment.objects.get(pk=data['appointment_id'])
            except Appointment.DoesNotExist:
                pass

        # Build message
        lang = data.get('lang') or getattr(patient, 'lang', 'en')
        if data.get('use_template') and appointment:
            time_str = str(appointment.scheduled_time) if appointment.scheduled_time else None
            message = build_appointment_reminder(
                patient.full_name,
                str(appointment.scheduled_date),
                time_str,
                lang=lang
            )
        elif data.get('use_template'):
            if lang == 'sw':
                message = f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
            else:
                message = f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
        else:
            message = data.get('message') or (
                f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
                if lang == 'sw'
                else f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
            )

        return Response({
            'message': message,
            'length': len(message),
            'patient_id': patient.id,
            'patient_name': patient.full_name,
            'phone_number': patient.phone_number,
        })


class BulkSendReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BulkSendReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
            
        data = serializer.validated_data
        patient_ids = data['patient_ids']
        use_template = data['use_template']
        message = data.get('message', '')
        lang = data.get('lang', 'en')
        
        from .tasks import send_bulk_reminders_task, send_bulk_reminders_sync

        if len(patient_ids) > 10:
            task = send_bulk_reminders_task.delay(
                patient_ids=patient_ids,
                use_template=use_template,
                message=message,
                lang=lang,
                user_id=request.user.id
            )
            return Response({
                'success': True,
                'queued': True,
                'task_id': task.id,
                'message': f'Queued bulk reminders for {len(patient_ids)} patients.'
            })
        else:
            results = send_bulk_reminders_sync(
                patient_ids=patient_ids,
                use_template=use_template,
                message=message,
                lang=lang,
                user_id=request.user.id
            )
            return Response({
                'success': True,
                'queued': False,
                'sent': results['sent'],
                'failed': results['failed'],
                'details': results['details']
            })
