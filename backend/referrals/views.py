from rest_framework import generics, permissions, filters
from .models import Referral, KMHFLFacility
from .serializers import ReferralSerializer, KMHFLFacilitySerializer

class KMHFLFacilityListView(generics.ListAPIView):
    """
    Search KMHFL facilities by name, code, or county
    """
    queryset = KMHFLFacility.objects.all()
    serializer_class = KMHFLFacilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'county']


class ReferralListCreateView(generics.ListCreateAPIView):
    """
    GET  — List all referrals (optionally filter by patient: ?patient=id)
    POST — Create a new referral (attaches current user as referred_by)
    """
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Referral.objects.select_related('patient', 'referred_by').all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)


class ReferralDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE referral details
    """
    queryset = Referral.objects.select_related('patient', 'referred_by').all()
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]
