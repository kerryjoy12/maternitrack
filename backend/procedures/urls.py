from django.urls import path
from .views import (
    ProcedureListView, ProcedureDetailView,
    EmergencyProtocolListView, EmergencyProtocolDetailView,
    ProtocolAccessLogView,
)

urlpatterns = [
    path('', ProcedureListView.as_view(), name='procedure_list'),
    path('<int:pk>/', ProcedureDetailView.as_view(), name='procedure_detail'),
    path('emergencies/', EmergencyProtocolListView.as_view(), name='emergency_list'),
    path('emergencies/<int:pk>/', EmergencyProtocolDetailView.as_view(), name='emergency_detail'),
    path('access-logs/', ProtocolAccessLogView.as_view(), name='protocol_access_logs'),
]
