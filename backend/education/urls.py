from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EducationCategoryViewSet, EducationResourceViewSet

router = DefaultRouter()
router.register(r'categories', EducationCategoryViewSet, basename='category')
router.register(r'resources', EducationResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]
