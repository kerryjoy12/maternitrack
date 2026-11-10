from rest_framework import serializers
from .models import MaternalDeathReview

class MaternalDeathReviewSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MaternalDeathReview
        fields = [
            'id', 'patient', 'patient_name', 'patient_number',
            'date_of_death', 'cause_of_death', 'avoidable_factors',
            'three_delays', 'recommendations', 'reviewed_by',
            'reviewed_by_name', 'review_date', 'is_near_miss',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reviewed_by', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name if obj.patient else "Anonymous / Unlinked"

    def get_patient_number(self, obj):
        return obj.patient.patient_number if obj.patient else "—"

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.full_name if obj.reviewed_by else None
