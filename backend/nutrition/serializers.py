from rest_framework import serializers
from .models import (
    NutritionCategory, PatientNutritionProfile,
    DietPlan, DietRecommendation, WeightLog,
)


class NutritionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionCategory
        fields = '__all__'


class PatientNutritionProfileSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)

    class Meta:
        model = PatientNutritionProfile
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name


class DietPlanSerializer(serializers.ModelSerializer):
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    categories_detail = NutritionCategorySerializer(source='categories', many=True, read_only=True)

    class Meta:
        model = DietPlan
        fields = '__all__'


class DietRecommendationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    diet_plan_detail = DietPlanSerializer(source='diet_plan', read_only=True)

    class Meta:
        model = DietRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name


class WeightLogSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WeightLog
        fields = '__all__'
        read_only_fields = ['id', 'recorded_at', 'recorded_by']

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.full_name if obj.recorded_by else None
