from rest_framework import serializers
from .models import ChildProfile, GrowthRecord, VaccinationRecord, ChildClinicVisit
from patients.serializers import PatientListSerializer

class VaccinationRecordSerializer(serializers.ModelSerializer):
    vaccine_name_display = serializers.CharField(source='get_vaccine_name_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = VaccinationRecord
        fields = '__all__'

class GrowthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthRecord
        fields = '__all__'

class ChildClinicVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildClinicVisit
        fields = '__all__'

class ChildProfileSerializer(serializers.ModelSerializer):
    mother_details = PatientListSerializer(source='mother', read_only=True)
    
    class Meta:
        model = ChildProfile
        fields = '__all__'

class ChildProfileDetailSerializer(ChildProfileSerializer):
    vaccinations = VaccinationRecordSerializer(many=True, read_only=True)
    growth_records = GrowthRecordSerializer(many=True, read_only=True)
    clinic_visits = ChildClinicVisitSerializer(many=True, read_only=True)
