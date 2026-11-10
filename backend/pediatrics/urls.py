from rest_framework.routers import DefaultRouter
from .views import (
    ChildProfileViewSet, GrowthRecordViewSet, 
    VaccinationRecordViewSet, ChildClinicVisitViewSet
)

router = DefaultRouter()
router.register(r'profiles', ChildProfileViewSet, basename='child-profile')
router.register(r'growth', GrowthRecordViewSet, basename='child-growth')
router.register(r'vaccinations', VaccinationRecordViewSet, basename='child-vaccinations')
router.register(r'clinic-visits', ChildClinicVisitViewSet, basename='child-clinic-visits')

urlpatterns = router.urls
