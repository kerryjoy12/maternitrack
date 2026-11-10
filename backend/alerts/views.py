from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import ClinicalAlert
from .serializers import ClinicalAlertSerializer


class IsClinicalStaff(permissions.BasePermission):
    message = 'Clinical staff access required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('ADMIN', 'DOCTOR', 'NURSE')
        )


class ClinicalAlertListView(generics.ListAPIView):
    """
    GET /api/alerts/
    Query params:
      ?unacknowledged=true  — only unacknowledged alerts
      ?patient=<id>         — filter by patient
      ?severity=CRITICAL    — filter by severity
    """
    serializer_class = ClinicalAlertSerializer
    permission_classes = [permissions.IsAuthenticated, IsClinicalStaff]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        qs = ClinicalAlert.objects.select_related(
            'patient', 'partograph_entry', 'acknowledged_by', 'symptom_report'
        )
        params = self.request.query_params
        if params.get('unacknowledged') == 'true':
            qs = qs.filter(acknowledged=False)
        if params.get('patient'):
            qs = qs.filter(patient_id=params['patient'])
        if params.get('severity'):
            qs = qs.filter(severity=params['severity'])
        return qs


class AcknowledgeAlertView(APIView):
    """
    POST /api/alerts/{pk}/acknowledge/
    Legacy endpoint — prefer follow-up for patient-facing alerts.
    """
    permission_classes = [permissions.IsAuthenticated, IsClinicalStaff]

    def post(self, request, pk):
        alert = get_object_or_404(ClinicalAlert, pk=pk)

        if alert.acknowledged:
            return Response({'message': 'Already followed up.'})

        alert.acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save(update_fields=['acknowledged', 'acknowledged_by', 'acknowledged_at'])
        return Response(ClinicalAlertSerializer(alert).data)


class AlertFollowUpView(APIView):
    """
    POST /api/alerts/{pk}/follow-up/
    Send a care message to the mother and mark the alert as followed up.
    """
    permission_classes = [permissions.IsAuthenticated, IsClinicalStaff]

    def post(self, request, pk):
        from patients.models import SecureMessage

        alert = get_object_or_404(
            ClinicalAlert.objects.select_related('patient', 'symptom_report'),
            pk=pk,
        )
        message_text = (request.data.get('message') or '').strip()
        if not message_text:
            return Response({'error': 'message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        mother_user = User.objects.filter(patient=alert.patient, role='MOTHER').first()
        if not mother_user:
            return Response(
                {'error': 'No mother portal account is linked to this patient.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        care_message = SecureMessage.objects.create(
            sender=request.user,
            recipient=mother_user,
            patient=alert.patient,
            message_type=SecureMessage.MessageType.CARE_ALERT,
            clinical_alert=alert,
            message=message_text,
            is_read=False,
        )

        if not alert.acknowledged:
            alert.acknowledged = True
            alert.acknowledged_by = request.user
            alert.acknowledged_at = timezone.now()
            alert.save(update_fields=['acknowledged', 'acknowledged_by', 'acknowledged_at'])

        if alert.symptom_report_id and alert.symptom_report.status == 'PENDING':
            report = alert.symptom_report
            report.status = 'REVIEWED'
            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        return Response({
            'alert': ClinicalAlertSerializer(alert).data,
            'care_message_id': care_message.id,
        }, status=status.HTTP_201_CREATED)


class UnacknowledgedCountView(APIView):
    """
    GET /api/alerts/count/
    Returns the count of unacknowledged alerts for the polling badge.
    """
    permission_classes = [permissions.IsAuthenticated, IsClinicalStaff]

    def get(self, request):
        count = ClinicalAlert.objects.filter(acknowledged=False).count()
        critical = ClinicalAlert.objects.filter(
            acknowledged=False,
            severity=ClinicalAlert.Severity.CRITICAL
        ).count()
        alerts = ClinicalAlert.objects.filter(
            acknowledged=False
        ).select_related('patient').order_by('-created_at')[:5]
        return Response({
            'total': count,
            'critical': critical,
            'recent': ClinicalAlertSerializer(alerts, many=True).data,
        })
