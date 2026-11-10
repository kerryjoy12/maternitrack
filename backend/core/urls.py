from django.urls import path
from .views import (
    AuditLogView,
    RealtimeStreamView,
    HospitalSettingsView,
    UpdateHospitalSettingsView
)
from .fhir_views import (
    FHIRPatientExportView,
    FHIRBundleExportView,
    FHIRProcedureExportView,
    FHIRProcedureBundleView,
    FHIRMockReceiverView
)

urlpatterns = [
    path('audit/<str:model_name>/<int:pk>/', AuditLogView.as_view(), name='audit-log'),
    # Real-time SSE Stream
    path('realtime/stream/', RealtimeStreamView.as_view(), name='realtime-stream'),
    # Hospital branding customization
    path('hospital-settings/', HospitalSettingsView.as_view(), name='hospital-settings'),
    path('hospital-settings/update/', UpdateHospitalSettingsView.as_view(), name='hospital-settings-update'),
    # FHIR R4 interoperability endpoints
    path('fhir/patient/<int:pk>/', FHIRPatientExportView.as_view(), name='fhir-patient'),
    path('fhir/patients/', FHIRBundleExportView.as_view(), name='fhir-bundle'),
    path('fhir/procedure/<int:pk>/', FHIRProcedureExportView.as_view(), name='fhir-procedure'),
    path('fhir/procedures/', FHIRProcedureBundleView.as_view(), name='fhir-procedures'),
    path('fhir/mock-receiver/', FHIRMockReceiverView.as_view(), name='fhir-mock-receiver'),
]
