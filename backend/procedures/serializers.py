from rest_framework import serializers
from .models import (
    ClinicalProcedure, ProcedureStep, EmergencyProtocol,
    EmergencyDrug, ProcedureEquipment, ClinicalChecklist, ProtocolAccessLog,
)


class ProcedureStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcedureStep
        fields = '__all__'


class ProcedureEquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcedureEquipment
        fields = ['id', 'name', 'description', 'category']


class ClinicalChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalChecklist
        fields = '__all__'


class ClinicalProcedureSerializer(serializers.ModelSerializer):
    steps = ProcedureStepSerializer(many=True, read_only=True)
    equipment = ProcedureEquipmentSerializer(many=True, read_only=True)
    checklists = ClinicalChecklistSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = ClinicalProcedure
        fields = '__all__'


class EmergencyDrugSerializer(serializers.ModelSerializer):
    route_display = serializers.CharField(source='get_route_display', read_only=True)

    class Meta:
        model = EmergencyDrug
        fields = '__all__'


class EmergencyProtocolSerializer(serializers.ModelSerializer):
    drugs = EmergencyDrugSerializer(many=True, read_only=True)
    equipment = ProcedureEquipmentSerializer(many=True, read_only=True)
    checklists = ClinicalChecklistSerializer(many=True, read_only=True)
    emergency_type_display = serializers.CharField(source='get_emergency_type_display', read_only=True)

    class Meta:
        model = EmergencyProtocol
        fields = '__all__'


class ProtocolAccessLogSerializer(serializers.ModelSerializer):
    accessed_by_name = serializers.SerializerMethodField()
    protocol_title = serializers.SerializerMethodField()

    class Meta:
        model = ProtocolAccessLog
        fields = '__all__'
        read_only_fields = ['id', 'accessed_at']

    def get_accessed_by_name(self, obj):
        return obj.accessed_by.full_name if obj.accessed_by else None

    def get_protocol_title(self, obj):
        return obj.protocol.title
