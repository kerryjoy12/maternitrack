from rest_framework import generics, permissions
from rest_framework.permissions import BasePermission
from .models import PMTCTRecord
from .serializers import PMTCTRecordSerializer

class HasPMTCTAccess(BasePermission):
    message = 'Access to PMTCT Registry is restricted.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, 'role', None)
        if role in ('ADMIN', 'DOCTOR'):
            return True
        if role == 'NURSE' and getattr(request.user, 'has_pmtct_permission', False):
            return True
        return False


class PMTCTRecordListCreateView(generics.ListCreateAPIView):
    """
    GET  — List all PMTCT registry records (optionally filter by patient: ?patient=id)
    POST — Register/log PMTCT details for a patient
    """
    serializer_class = PMTCTRecordSerializer
    permission_classes = [HasPMTCTAccess]

    def get_queryset(self):
        queryset = PMTCTRecord.objects.select_related('patient', 'counselor').all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(counselor=self.request.user)


class PMTCTRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE a patient's PMTCT record
    """
    queryset = PMTCTRecord.objects.select_related('patient', 'counselor').all()
    serializer_class = PMTCTRecordSerializer
    permission_classes = [HasPMTCTAccess]
