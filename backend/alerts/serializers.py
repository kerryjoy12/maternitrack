from rest_framework import serializers
from .models import ClinicalAlert


class ClinicalAlertSerializer(serializers.ModelSerializer):
    patient_name   = serializers.CharField(source='patient.full_name',   read_only=True)
    patient_number = serializers.CharField(source='patient.patient_number', read_only=True)
    alert_type_display   = serializers.CharField(source='get_alert_type_display',  read_only=True)
    severity_display     = serializers.CharField(source='get_severity_display',    read_only=True)
    acknowledged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ClinicalAlert
        fields = [
            'id', 'patient', 'patient_name', 'patient_number',
            'partograph_entry', 'alert_type', 'alert_type_display',
            'severity', 'severity_display',
            'value_triggered', 'threshold', 'message',
            'acknowledged', 'acknowledged_by', 'acknowledged_by_name',
            'acknowledged_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'acknowledged_at',
            'acknowledged_by', 'patient_name', 'patient_number',
            'alert_type_display', 'severity_display', 'acknowledged_by_name',
        ]

    def get_acknowledged_by_name(self, obj):
        return obj.acknowledged_by.full_name if obj.acknowledged_by else None
