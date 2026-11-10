from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from patients.models import Patient
from .models import (
    NutritionCategory, PatientNutritionProfile,
    DietPlan, DietRecommendation, WeightLog,
)
from .serializers import (
    NutritionCategorySerializer, PatientNutritionProfileSerializer,
    DietPlanSerializer, DietRecommendationSerializer, WeightLogSerializer,
)
from .services import get_or_create_nutrition_profile, generate_recommendations, seed_default_plans


class NutritionCategoryListView(generics.ListAPIView):
    queryset = NutritionCategory.objects.all()
    serializer_class = NutritionCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Return all categories


class PatientNutritionProfileView(APIView):
    """
    GET /api/nutrition/profile/<patient_id>/
    Returns or creates the patient's nutrition profile with auto-detection.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_id):
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        profile = get_or_create_nutrition_profile(patient)
        return Response(PatientNutritionProfileSerializer(profile).data)

    def patch(self, request, patient_id):
        """Doctor/nurse can override nutrition profile fields."""
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        profile = get_or_create_nutrition_profile(patient)
        serializer = PatientNutritionProfileSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class PatientDietRecommendationsView(APIView):
    """
    GET  /api/nutrition/recommendations/<patient_id>/
    POST /api/nutrition/recommendations/<patient_id>/generate/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_id):
        recs = DietRecommendation.objects.filter(
            patient_id=patient_id, status='ACTIVE'
        ).select_related('diet_plan').order_by('diet_plan__day_of_week', 'diet_plan__meal_type')
        return Response(DietRecommendationSerializer(recs, many=True).data)


class GenerateRecommendationsView(APIView):
    """
    POST /api/nutrition/recommendations/<patient_id>/generate/
    Auto-generates diet recommendations based on patient condition.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, patient_id):
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        # Seed defaults if empty
        seed_default_plans()

        created = generate_recommendations(patient)
        return Response({
            'message': f'{len(created)} recommendations generated.',
            'count': len(created),
            'recommendations': DietRecommendationSerializer(created, many=True).data,
        })


class DietPlanListView(generics.ListCreateAPIView):
    """
    GET  — list all diet plans (filterable by phase, meal_type)
    POST — admin/doctor can create custom plans
    """
    serializer_class = DietPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = DietPlan.objects.filter(is_active=True)
        phase = self.request.query_params.get('phase')
        meal = self.request.query_params.get('meal_type')
        if phase:
            qs = qs.filter(phase=phase)
        if meal:
            qs = qs.filter(meal_type=meal)
        return qs


class WeightLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WeightLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeightLog.objects.filter(
            patient_id=self.kwargs['patient_id']
        ).order_by('recorded_at')

    def perform_create(self, serializer):
        patient = Patient.objects.get(pk=self.kwargs['patient_id'])
        serializer.save(patient=patient, recorded_by=self.request.user)


class SeedDietPlansView(APIView):
    """POST /api/nutrition/seed/ — Admin only: seed default diet plans."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response({'error': 'Admin only.'}, status=403)
        seed_default_plans()
        count = DietPlan.objects.count()
        return Response({'message': f'{count} diet plans in database.'})
