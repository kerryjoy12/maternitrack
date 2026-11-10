from django.urls import path
from .views import KMHFLFacilityListView, ReferralListCreateView, ReferralDetailView

urlpatterns = [
    path('', ReferralListCreateView.as_view(), name='referral_list_create'),
    path('<int:pk>/', ReferralDetailView.as_view(), name='referral_detail'),
    path('facilities/', KMHFLFacilityListView.as_view(), name='kmhfl_facility_list'),
]
