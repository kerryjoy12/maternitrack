from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from datetime import date, timedelta
from core.permissions import IsMotherRole
from patients.models import Patient, SymptomReport, SecureMessage
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer, AppointmentCreateSerializer
from clinical.models import ANCVisit, ClinicalNote, PatientDocument
from clinical.serializers import ANCVisitSerializer, ClinicalNoteSerializer, PatientDocumentSerializer
from pediatrics.models import ChildProfile, VaccinationRecord
from alerts.models import ClinicalAlert
from alerts.services import create_symptom_report_alert
from patients.serializers import SymptomReportSerializer, SecureMessageSerializer, PatientSerializer

class MotherDashboardView(APIView):
    """
    GET /api/patients/mother/dashboard/
    Provides aggregated statistics for the logged-in Mother user.
    """
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def get(self, request):
        patient = request.user.patient
        today = date.today()

        # 1. Pregnancy status & trimester
        weeks = patient.weeks_pregnant or 0
        if patient.clinic_stage == 'DELIVERED' or patient.clinic_stage == 'POSTNATAL':
            status_text = "Postnatal Care"
            trimester = None
        else:
            status_text = "Pregnancy Active"
            if weeks <= 12:
                trimester = "1st Trimester"
            elif weeks <= 26:
                trimester = "2nd Trimester"
            else:
                trimester = "3rd Trimester"

        # 2. Next Upcoming Appointment
        next_appt = Appointment.objects.filter(
            patient=patient,
            status='UPCOMING',
            scheduled_date__gte=today
        ).order_by('scheduled_date', 'scheduled_time').first()
        next_appt_data = AppointmentSerializer(next_appt).data if next_appt else None

        # 3. Upcoming vaccines (maternal tetanus/influenza + baby vaccines)
        vaccines = []
        if patient.clinic_stage not in ('DELIVERED', 'POSTNATAL'):
            # Maternal prenatal vaccines
            maternal_schedule = [
                ('TT1', 'Tetanus Toxoid 1', 16),
                ('TT2', 'Tetanus Toxoid 2', 20),
                ('Influenza', 'Influenza Vaccine', 24),
                ('TT3', 'Tetanus Toxoid 3', 28),
                ('TT4', 'Tetanus Toxoid 4', 36),
            ]
            for code, name, week in maternal_schedule:
                if weeks >= week:
                    status_val = 'OVERDUE' if weeks > (week + 2) else 'DUE'
                else:
                    status_val = 'UPCOMING'
                vaccines.append({
                    'target': 'Mother',
                    'vaccine_name': name,
                    'recommended_week': week,
                    'status': status_val,
                    'expected_date': (patient.lmp + timedelta(weeks=week)) if patient.lmp else None
                })
        else:
            # Child vaccines if delivered
            children = ChildProfile.objects.filter(mother=patient)
            for child in children:
                pending_child_vaccines = VaccinationRecord.objects.filter(child=child, status='PENDING')
                for vac in pending_child_vaccines:
                    vaccines.append({
                        'target': f"Child: {child.first_name or 'Baby'}",
                        'vaccine_name': vac.get_vaccine_name_display(),
                        'recommended_week': None,
                        'status': vac.status,
                        'expected_date': vac.expected_date
                    })

        # 4. General secure messages (chat page)
        unread_messages_count = SecureMessage.objects.filter(
            recipient=request.user,
            message_type=SecureMessage.MessageType.GENERAL,
            is_read=False,
        ).count()

        # 5. Care alerts from clinical staff (summons, follow-ups, instructions)
        care_alerts = SecureMessage.objects.filter(
            patient=patient,
            message_type=SecureMessage.MessageType.CARE_ALERT,
        ).select_related('sender', 'clinical_alert').order_by('-created_at')[:10]
        care_alerts_data = SecureMessageSerializer(care_alerts, many=True).data

        # Assemble dashboard payload
        dashboard_data = {
            'pregnancy_status': status_text,
            'gestational_age_weeks': weeks,
            'expected_delivery_date': patient.edd,
            'trimester': trimester,
            'next_appointment': next_appt_data,
            'upcoming_vaccines': vaccines[:5],  # Limit to 5
            'unread_messages_count': unread_messages_count,
            'care_alerts': care_alerts_data,
            'risk_level': patient.risk_level,
        }
        return Response(dashboard_data)


class MotherAppointmentsView(generics.ListCreateAPIView):
    """
    GET /api/patients/mother/appointments/
    POST /api/patients/mother/appointments/
    List and create appointments for the logged-in Mother.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]
    pagination_class = None

    def get_queryset(self):
        patient = self.request.user.patient
        return Appointment.objects.filter(patient=patient).order_by('scheduled_date')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        patient = self.request.user.patient
        serializer.save(patient=patient)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        appt = Appointment.objects.get(pk=response.data['id'])
        return Response(AppointmentSerializer(appt).data, status=201)


class MotherRescheduleAppointmentView(APIView):
    """
    POST /api/patients/mother/appointments/<id>/reschedule/
    Allows a Mother to request rescheduling of an upcoming appointment.
    """
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def post(self, request, pk):
        patient = request.user.patient
        try:
            appointment = Appointment.objects.get(pk=pk, patient=patient)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status != 'UPCOMING':
            return Response({'error': 'Only upcoming appointments can be rescheduled.'}, status=status.HTTP_400_BAD_REQUEST)

        new_date = request.data.get('scheduled_date')
        new_time = request.data.get('scheduled_time')
        reason = request.data.get('reason', '')

        if not new_date:
            return Response({'error': 'scheduled_date is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark as rescheduled and save new requested parameters
        appointment.status = 'RESCHEDULED'
        appointment.scheduled_date = new_date
        if new_time:
            appointment.scheduled_time = new_time
        if reason:
            appointment.notes = f"{appointment.notes}\n[Rescheduled by Mother]: {reason}".strip()
        appointment.save()

        # Create a notification alert for the clinical staff
        ClinicalAlert.objects.create(
            patient=patient,
            alert_type='ALERT_LINE_CROSSED',  # Or a generic alert code
            severity='WARNING',
            message=f"Appointment {appointment.appointment_type} reschedule requested by Mother for {new_date}."
        )

        return Response(AppointmentSerializer(appointment).data)


class MotherPregnancyTrackingView(APIView):
    """
    GET /api/patients/mother/pregnancy-tracking/
    Provides trimester, weeks pregnant, EDD, ANC history, and milestones.
    """
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def get(self, request):
        patient = request.user.patient
        weeks = patient.weeks_pregnant or 0
        today = date.today()

        # ANC visits list
        visits = ANCVisit.objects.filter(patient=patient).order_by('visit_number')
        visits_data = ANCVisitSerializer(visits, many=True).data

        # Milestones progress calculation
        # Milestones: Registration -> ANC1 -> ANC2 -> ANC3 -> ANC4 -> Delivery -> Postnatal
        milestones = [
            {'id': 'REGISTRATION', 'name': 'Registration', 'completed': True, 'date': patient.created_at.date()},
            {'id': 'ANC1', 'name': 'ANC Visit 1 (10-16 Weeks)', 'completed': False, 'date': None},
            {'id': 'ANC2', 'name': 'ANC Visit 2 (20-24 Weeks)', 'completed': False, 'date': None},
            {'id': 'ANC3', 'name': 'ANC Visit 3 (28-32 Weeks)', 'completed': False, 'date': None},
            {'id': 'ANC4', 'name': 'ANC Visit 4 (36-40 Weeks)', 'completed': False, 'date': None},
            {'id': 'DELIVERY', 'name': 'Delivery / Birth', 'completed': False, 'date': None},
            {'id': 'POSTNATAL', 'name': 'Postnatal Care', 'completed': False, 'date': None},
        ]

        # Map completed visits to milestones
        for visit in visits:
            num = visit.visit_number
            if 1 <= num <= 4:
                idx = num  # ANC1 is at index 1, ANC2 is index 2, etc.
                milestones[idx]['completed'] = True
                milestones[idx]['date'] = visit.visit_date

        if patient.clinic_stage in ('DELIVERED', 'POSTNATAL'):
            milestones[5]['completed'] = True
            # Try to grab postnatal record date if exists
            from postnatal.models import PostnatalRecord
            post_rec = PostnatalRecord.objects.filter(patient=patient).first()
            if post_rec:
                milestones[5]['date'] = post_rec.delivery_date

        if patient.clinic_stage == 'POSTNATAL':
            milestones[6]['completed'] = True
            from postnatal.models import PostnatalRecord
            post_rec = PostnatalRecord.objects.filter(patient=patient).first()
            if post_rec:
                milestones[6]['date'] = post_rec.created_at.date()

        return Response({
            'weeks_pregnant': weeks,
            'edd': patient.edd,
            'lmp': patient.lmp,
            'trimester_info': "1st Trimester" if weeks <= 12 else "2nd Trimester" if weeks <= 26 else "3rd Trimester",
            'milestones': milestones,
            'anc_visits': visits_data
        })


class MotherMedicalRecordsView(APIView):
    """
    GET /api/patients/mother/medical-records/
    Provides read-only access to the mother's own medical, surgical, allergy, and clinical records.
    """
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def get(self, request):
        patient = request.user.patient
        
        # Serialize full Patient details (including nested medical, surgical, allergy and family history)
        patient_data = PatientSerializer(patient).data

        # Gather extra clinical history records
        clinical_notes = ClinicalNote.objects.filter(patient=patient).order_by('-created_at')
        notes_data = ClinicalNoteSerializer(clinical_notes, many=True).data

        documents = PatientDocument.objects.filter(patient=patient).order_by('-created_at')
        documents_data = PatientDocumentSerializer(documents, many=True).data

        return Response({
            'demographics_and_history': patient_data,
            'clinical_notes': notes_data,
            'uploaded_documents': documents_data
        })


class MotherSymptomReportListView(generics.ListCreateAPIView):
    """
    GET /api/patients/mother/symptoms/  - List all symptom reports
    POST /api/patients/mother/symptoms/ - Report new symptoms
    """
    serializer_class = SymptomReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]
    pagination_class = None

    def get_queryset(self):
        patient = self.request.user.patient
        return SymptomReport.objects.filter(patient=patient).order_by('-reported_at')

    def perform_create(self, serializer):
        patient = self.request.user.patient
        report = serializer.save(patient=patient, status='PENDING')
        create_symptom_report_alert(report)


class MotherSecureMessageListView(generics.ListCreateAPIView):
    """
    GET /api/patients/mother/messages/  - List portal messaging history
    POST /api/patients/mother/messages/ - Send secure message
    """
    serializer_class = SecureMessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]
    pagination_class = None

    def get_queryset(self):
        patient = self.request.user.patient
        return SecureMessage.objects.filter(
            patient=patient,
            message_type=SecureMessage.MessageType.GENERAL,
        ).order_by('created_at')

    def perform_create(self, serializer):
        patient = self.request.user.patient
        recipient = patient.registered_by
        message = serializer.save(
            sender=self.request.user,
            recipient=recipient,
            patient=patient,
            message_type=SecureMessage.MessageType.GENERAL,
        )
        # Create a ClinicalAlert so the doctor sees it in the Alerts page
        ClinicalAlert.objects.create(
            patient=patient,
            alert_type='PATIENT_MESSAGE',
            severity='WARNING',
            message=f"{patient.full_name} ({patient.patient_number}): {message.message}",
        )


class MotherChildrenView(APIView):
    """
    GET /api/patients/mother/children/
    Returns the logged-in mother's child profiles with vaccinations, growth records, and clinic visits.
    """
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def get(self, request):
        from pediatrics.models import ChildProfile
        from pediatrics.serializers import ChildProfileDetailSerializer
        patient = request.user.patient
        children = ChildProfile.objects.filter(mother=patient).prefetch_related(
            'vaccinations', 'growth_records', 'clinic_visits'
        )
        return Response(ChildProfileDetailSerializer(children, many=True).data)


class MotherMarkCareAlertReadView(APIView):
    """POST /api/patients/mother/care-alerts/<id>/read/"""
    permission_classes = [permissions.IsAuthenticated, IsMotherRole]

    def post(self, request, pk):
        patient = request.user.patient
        try:
            message = SecureMessage.objects.get(
                pk=pk,
                patient=patient,
                message_type=SecureMessage.MessageType.CARE_ALERT,
            )
        except SecureMessage.DoesNotExist:
            return Response({'error': 'Care alert not found.'}, status=status.HTTP_404_NOT_FOUND)

        message.is_read = True
        message.save(update_fields=['is_read'])
        return Response(SecureMessageSerializer(message).data)
