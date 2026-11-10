from django.urls import path
from .views import (
    CustomLoginView, RegisterView, MeView, StaffListView,
    StaffDetailView, StaffDeactivateView, StaffReactivateView, 
    ChangeRoleView, TogglePMTCTAccessView,
)

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='user_login'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('me/', MeView.as_view(), name='user_me'),
    path('staff/', StaffListView.as_view(), name='staff_list'),
    path('staff/<uuid:pk>/', StaffDetailView.as_view(), name='staff_detail'),
    path('staff/<uuid:pk>/deactivate/', StaffDeactivateView.as_view(), name='staff_deactivate'),
    path('staff/<uuid:pk>/reactivate/', StaffReactivateView.as_view(), name='staff_reactivate'),
    path('staff/<uuid:pk>/role/', ChangeRoleView.as_view(), name='staff_change_role'),
    path('staff/<uuid:pk>/pmtct-permission/', TogglePMTCTAccessView.as_view(), name='staff_pmtct_permission'),
]
