from rest_framework import serializers
from .models import Appointment
from patients.serializers import PatientListSerializer


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    patient_phone = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'patient_number', 'patient_phone',
            'appointment_type', 'scheduled_date', 'scheduled_time',
            'attended_date', 'status', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number

    def get_patient_phone(self, obj):
        return obj.patient.phone_number

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name
        return None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_type', 'scheduled_date',
            'scheduled_time', 'notes',
        ]
        read_only_fields = ['id']
