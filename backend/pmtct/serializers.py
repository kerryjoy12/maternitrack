from rest_framework import serializers
from .models import PMTCTRecord

class PMTCTRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    counselor_name = serializers.SerializerMethodField()

    class Meta:
        model = PMTCTRecord
        fields = [
            'id', 'patient', 'patient_name', 'patient_number',
            'hiv_status', 'test_date', 'arv_regimen', 'arv_start_date',
            'viral_load', 'viral_load_date', 'cd4_count',
            'infant_prophylaxis', 'infant_test_at_6wk',
            'infant_test_at_18mo', 'disclosure_status',
            'counselor', 'counselor_name', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'counselor', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number

    def get_counselor_name(self, obj):
        return obj.counselor.full_name if obj.counselor else None
