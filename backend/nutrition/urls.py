from django.urls import path
from .views import (
    NutritionCategoryListView, PatientNutritionProfileView,
    PatientDietRecommendationsView, GenerateRecommendationsView,
    DietPlanListView, WeightLogListCreateView, SeedDietPlansView,
)

urlpatterns = [
    path('categories/', NutritionCategoryListView.as_view(), name='nutrition_categories'),
    path('plans/', DietPlanListView.as_view(), name='diet_plan_list'),
    path('profile/<int:patient_id>/', PatientNutritionProfileView.as_view(), name='nutrition_profile'),
    path('recommendations/<int:patient_id>/', PatientDietRecommendationsView.as_view(), name='diet_recommendations'),
    path('recommendations/<int:patient_id>/generate/', GenerateRecommendationsView.as_view(), name='generate_recommendations'),
    path('weight/<int:patient_id>/', WeightLogListCreateView.as_view(), name='weight_logs'),
    path('seed/', SeedDietPlansView.as_view(), name='seed_diet_plans'),
]
