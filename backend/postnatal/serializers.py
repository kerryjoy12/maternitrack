from rest_framework import serializers
from .models import PostnatalRecord


class PostnatalSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    review_7day_overdue = serializers.ReadOnlyField()
    review_6week_overdue = serializers.ReadOnlyField()

    class Meta:
        model = PostnatalRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'review_7day_date', 'review_6week_date']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number
