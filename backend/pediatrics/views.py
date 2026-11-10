from rest_framework import viewsets
from .models import ChildProfile, GrowthRecord, VaccinationRecord, ChildClinicVisit
from .serializers import (
    ChildProfileSerializer, ChildProfileDetailSerializer, 
    GrowthRecordSerializer, VaccinationRecordSerializer, ChildClinicVisitSerializer
)

class ChildProfileViewSet(viewsets.ModelViewSet):
    queryset = ChildProfile.objects.all().select_related('mother')
    filterset_fields = ['mother']
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return ChildProfileDetailSerializer
        return ChildProfileSerializer

class GrowthRecordViewSet(viewsets.ModelViewSet):
    queryset = GrowthRecord.objects.all()
    serializer_class = GrowthRecordSerializer
    filterset_fields = ['child']

class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.all()
    serializer_class = VaccinationRecordSerializer
    filterset_fields = ['child', 'status']

class ChildClinicVisitViewSet(viewsets.ModelViewSet):
    queryset = ChildClinicVisit.objects.all()
    serializer_class = ChildClinicVisitSerializer
    filterset_fields = ['child']
