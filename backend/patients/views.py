from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Patient, Pregnancy, PartographEntry
from .serializers import PatientSerializer, PatientListSerializer, PregnancySerializer, PartographEntrySerializer
from core.permissions import CanEditOwnPartograph

try:
    from django_filters.rest_framework import DjangoFilterBackend
    _django_filter = True
except ImportError:
    _django_filter = False


class PatientListCreateView(generics.ListCreateAPIView):
    """
    GET  — any authenticated user can list patients.
    POST — any authenticated staff can register a new patient.

    Search:   ?search=Jane
    Filters:  ?stage=ANC2&risk=HIGH&edd_from=2026-01-01&edd_to=2026-06-01
    Ordering: ?ordering=-edd  (edd, created_at, full_name, clinic_stage)
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        filters.OrderingFilter,
    ] + ([DjangoFilterBackend] if _django_filter else [])
    search_fields = [
        'full_name', 'patient_number', 'phone_number', 'address',
        'residence_county', 'residence_village', 'national_id', 'next_of_kin_name',
    ]
    ordering_fields = ['full_name', 'edd', 'created_at', 'clinic_stage', 'risk_level', 'registration_stage']
    ordering = ['-created_at']
    filterset_fields = {
        'clinic_stage': ['exact'],
        'risk_level':   ['exact'],
        'registration_stage': ['exact'],
        'edd':          ['gte', 'lte'],
    } if _django_filter else {}

    def get_queryset(self):
        if getattr(self.request.user, 'role', None) == 'ADMIN':
            qs = Patient.objects.all().select_related('registered_by')
        else:
            qs = Patient.objects.filter(is_active=True).select_related('registered_by')
        
        # Search handling (with support for exact hash matching of encrypted fields)
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            import hashlib
            from django.db.models import Q
            query_hash = hashlib.sha256(search_query.encode('utf-8')).hexdigest()
            qs = qs.filter(
                Q(national_id_hash=query_hash) |
                Q(nhif_number_hash=query_hash) |
                Q(phone_number_hash=query_hash) |
                Q(full_name__icontains=search_query) |
                Q(patient_number__icontains=search_query) |
                Q(address__icontains=search_query)
            )

        # Manual fallback filters if django-filter not installed
        if not _django_filter:
            stage = self.request.query_params.get('stage')
            risk  = self.request.query_params.get('risk')
            reg_stage = self.request.query_params.get('registration_stage')
            if stage:
                qs = qs.filter(clinic_stage=stage)
            if risk:
                qs = qs.filter(risk_level=risk)
            if reg_stage:
                qs = qs.filter(registration_stage=reg_stage)
        # Additional convenience filters
        edd_from = self.request.query_params.get('edd_from')
        edd_to   = self.request.query_params.get('edd_to')
        if edd_from and not _django_filter:
            qs = qs.filter(edd__gte=edd_from)
        if edd_to and not _django_filter:
            qs = qs.filter(edd__lte=edd_to)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PatientListSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH — any authenticated staff.
    DELETE      — ADMIN only (soft-delete, sets is_active=False).
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response(
                {'error': 'Only administrators can delete patient records.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        patient = self.get_object()
        patient.delete()
        return Response({'message': 'Patient and all related records deleted successfully.'})


class PatientStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        from appointments.models import Appointment
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        appointments = Appointment.objects.filter(patient=patient)
        partograph_count = PartographEntry.objects.filter(patient=patient).count()
        return Response({
            'total_appointments':  appointments.count(),
            'attended':            appointments.filter(status='ATTENDED').count(),
            'missed':              appointments.filter(status='MISSED').count(),
            'upcoming':            appointments.filter(status='UPCOMING').count(),
            'partograph_entries':  partograph_count,
        })


# ─── Partograph API ────────────────────────────────────────────────────────────

class PartographListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/patients/{patient_id}/partograph/  → all entries for that patient
    POST /api/patients/{patient_id}/partograph/  → add a new observation
    """
    serializer_class = PartographEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartographEntry.objects.filter(
            patient_id=self.kwargs['patient_id']
        ).select_related('recorded_by').order_by('hours_in_labour')

    def perform_create(self, serializer):
        patient = Patient.objects.get(pk=self.kwargs['patient_id'])
        serializer.save(patient=patient, recorded_by=self.request.user)


class PartographEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    — any authenticated user.
    PATCH  — nurse who recorded it, or ADMIN.
    DELETE — nurse who recorded it, or ADMIN.
    """
    serializer_class = PartographEntrySerializer
    permission_classes = [permissions.IsAuthenticated, CanEditOwnPartograph]

    def get_queryset(self):
        return PartographEntry.objects.filter(
            patient_id=self.kwargs['patient_id']
        ).select_related('recorded_by')


class PatientTimelineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        events = []

        # 1. Registration
        events.append({
            'type': 'REGISTRATION',
            'title': 'Patient Registered',
            'description': f"Registered with number {patient.patient_number} at stage {patient.clinic_stage}.",
            'timestamp': patient.created_at,
            'meta': {}
        })

        # 1b. Pregnancies
        from .models import Pregnancy
        pregnancies = Pregnancy.objects.filter(patient=patient)
        for preg in pregnancies:
            events.append({
                'type': 'PREGNANCY_RECORD',
                'title': f"Pregnancy #{preg.pregnancy_number} Registered",
                'description': f"LMP: {preg.lmp}, EDD: {preg.edd}, Gravida: {preg.gravida or 1}, Parity: {preg.parity or 0}. Status: {preg.get_status_display()}.",
                'timestamp': preg.created_at,
                'meta': {
                    'pregnancy_number': preg.pregnancy_number,
                    'lmp': str(preg.lmp),
                    'edd': str(preg.edd) if preg.edd else None,
                    'is_high_risk': preg.is_high_risk,
                    'risk_level': preg.risk_level,
                    'status': preg.status,
                }
            })

        # 2. Appointments
        from appointments.models import Appointment
        appts = Appointment.objects.filter(patient=patient)
        for appt in appts:
            events.append({
                'type': 'APPOINTMENT',
                'title': f"Appointment: {appt.appointment_type}",
                'description': f"Status: {appt.status}. Scheduled on {appt.scheduled_date}.",
                'timestamp': appt.created_at,
                'meta': {
                    'scheduled_date': str(appt.scheduled_date),
                    'status': appt.status,
                    'type': appt.appointment_type,
                    'notes': appt.reason_for_visit
                }
            })

        # 3. Clinical Notes
        from clinical.models import ClinicalNote
        notes = ClinicalNote.objects.filter(patient=patient)
        for n in notes:
            events.append({
                'type': 'CLINICAL_NOTE',
                'title': 'Clinical Note Logged',
                'description': f"Subjective: {n.subjective_symptoms[:100] if n.subjective_symptoms else ''}...",
                'timestamp': n.created_at,
                'meta': {
                    'symptoms': n.subjective_symptoms,
                    'diagnosis': n.assessment_diagnosis,
                    'plan': n.plan_intervention,
                    'by': n.clinician.full_name if n.clinician else 'Staff'
                }
            })

        # 4. ANC Visits
        from clinical.models import ANCVisit
        anc_visits = ANCVisit.objects.filter(patient=patient)
        for visit in anc_visits:
            sys_bp = getattr(visit, 'bp_systolic', getattr(visit, 'systolic_bp', ''))
            dia_bp = getattr(visit, 'bp_diastolic', getattr(visit, 'diastolic_bp', ''))
            bp_str = f"{sys_bp}/{dia_bp}" if sys_bp and dia_bp else "N/A"
            events.append({
                'type': 'ANC_VISIT',
                'title': f"ANC Visit #{visit.visit_number} ({visit.get_visit_status_display() if hasattr(visit, 'get_visit_status_display') else 'Completed'})",
                'description': f"Weight: {visit.weight_kg or 'N/A'}kg, BP: {bp_str} mmHg.",
                'timestamp': visit.created_at,
                'meta': {
                    'visit_number': visit.visit_number,
                    'weight': str(visit.weight_kg) if visit.weight_kg else None,
                    'bp': bp_str,
                    'fundal_height': visit.fundal_height_cm,
                    'fetal_heart_rate': visit.fetal_heart_rate,
                    'muac': str(visit.muac_cm) if visit.muac_cm else None,
                    'remarks': visit.remarks or visit.consultation_notes
                }
            })

        # 5. Partograph Entries
        from patients.models import PartographEntry
        parts = PartographEntry.objects.filter(patient=patient)
        if parts.exists():
            first_part = parts.order_by('recorded_at').first()
            last_part = parts.order_by('-recorded_at').first()
            events.append({
                'type': 'PARTOGRAPH',
                'title': 'Partograph Monitoring',
                'description': f"Monitored in labor ward. Recorded {parts.count()} observations.",
                'timestamp': last_part.recorded_at,
                'meta': {
                    'entries_count': parts.count()
                }
            })

        # 6. Referrals
        from referrals.models import Referral
        refs = Referral.objects.filter(patient=patient)
        for ref in refs:
            events.append({
                'type': 'REFERRAL',
                'title': 'Patient Referral',
                'description': f"Referred to {ref.destination_facility}. Reason: {ref.reason_for_referral}.",
                'timestamp': ref.created_at,
                'meta': {
                    'facility': ref.destination_facility,
                    'reason': ref.reason_for_referral,
                    'status': ref.status,
                    'outcome': ref.outcome_details,
                    'by': ref.referred_by.full_name if ref.referred_by else 'Staff'
                }
            })

        # 7. Postnatal Records
        from postnatal.models import PostnatalRecord
        post_recs = PostnatalRecord.objects.filter(patient=patient)
        for pr in post_recs:
            events.append({
                'type': 'POSTNATAL',
                'title': 'Delivery & Postnatal Record',
                'description': f"Delivery Date: {pr.delivery_date}. Outcome: {pr.delivery_outcome}.",
                'timestamp': pr.created_at,
                'meta': {
                    'delivery_date': str(pr.delivery_date),
                    'outcome': pr.delivery_outcome,
                    'mode': pr.delivery_mode,
                    'complications': pr.maternal_complications
                }
            })

        # 8. PMTCT Registry
        from pmtct.models import PMTCTRecord
        try:
            pmtct_rec = PMTCTRecord.objects.get(patient=patient)
            events.append({
                'type': 'PMTCT',
                'title': 'PMTCT Registry Logged',
                'description': f"HIV Status: {pmtct_rec.hiv_status}. Disclosure status: {pmtct_rec.disclosure_status}.",
                'timestamp': pmtct_rec.created_at,
                'meta': {
                    'hiv_status': pmtct_rec.hiv_status,
                    'disclosure': pmtct_rec.disclosure_status,
                    'arv': pmtct_rec.arv_regimen
                }
            })
        except PMTCTRecord.DoesNotExist:
            pass

        # Sort all events chronologically (newest first)
        events.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response({
            'patient_id': patient.id,
            'full_name': patient.full_name,
            'events': events
        })


class PregnancyListCreateView(generics.ListCreateAPIView):
    """
    GET /api/patients/<patient_id>/pregnancies/ — List all pregnancy episodes for a patient.
    POST /api/patients/<patient_id>/pregnancies/ — Register a new pregnancy episode for a patient.
    """
    serializer_class = PregnancySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        if patient_id:
            return Pregnancy.objects.filter(patient_id=patient_id)
        return Pregnancy.objects.all()

    def perform_create(self, serializer):
        patient_id = self.kwargs.get('patient_id')
        patient = generics.get_object_or_404(Patient, pk=patient_id)
        serializer.save(patient=patient)


class PregnancyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE /api/pregnancies/<id>/ — Retrieve, update or delete a specific pregnancy episode.
    """
    queryset = Pregnancy.objects.all()
    serializer_class = PregnancySerializer
    permission_classes = [permissions.IsAuthenticated]


