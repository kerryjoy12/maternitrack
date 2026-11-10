from django.urls import path
from .views import (
    PatientListCreateView, PatientDetailView, PatientStatsView,
    PartographListCreateView, PartographEntryDetailView, PatientTimelineView,
    PregnancyListCreateView, PregnancyDetailView,
)
from .pdf_views import PartographPDFView
from .portal_views import (
    MotherDashboardView,
    MotherAppointmentsView,
    MotherRescheduleAppointmentView,
    MotherPregnancyTrackingView,
    MotherMedicalRecordsView,
    MotherSymptomReportListView,
    MotherSecureMessageListView,
    MotherMarkCareAlertReadView,
    MotherChildrenView,
)

urlpatterns = [
    path('', PatientListCreateView.as_view(), name='patient_list_create'),
    path('<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    path('<int:pk>/stats/', PatientStatsView.as_view(), name='patient_stats'),
    path('<int:pk>/timeline/', PatientTimelineView.as_view(), name='patient_timeline'),
    path('<int:patient_id>/pregnancies/', PregnancyListCreateView.as_view(), name='patient_pregnancies'),
    path('pregnancies/<int:pk>/', PregnancyDetailView.as_view(), name='pregnancy_detail'),
    
    # Mother Portal Endpoints
    path('mother/dashboard/', MotherDashboardView.as_view(), name='mother_dashboard'),
    path('mother/appointments/', MotherAppointmentsView.as_view(), name='mother_appointments'),
    path('mother/appointments/<int:pk>/reschedule/', MotherRescheduleAppointmentView.as_view(), name='mother_reschedule_appointment'),
    path('mother/pregnancy-tracking/', MotherPregnancyTrackingView.as_view(), name='mother_pregnancy_tracking'),
    path('mother/medical-records/', MotherMedicalRecordsView.as_view(), name='mother_medical_records'),
    path('mother/symptoms/', MotherSymptomReportListView.as_view(), name='mother_symptoms'),
    path('mother/messages/', MotherSecureMessageListView.as_view(), name='mother_messages'),
    path('mother/care-alerts/<int:pk>/read/', MotherMarkCareAlertReadView.as_view(), name='mother_care_alert_read'),
    path('mother/children/', MotherChildrenView.as_view(), name='mother_children'),

    # Partograph
    path('<int:patient_id>/partograph/', PartographListCreateView.as_view(), name='partograph_list_create'),
    path('<int:patient_id>/partograph/<int:pk>/', PartographEntryDetailView.as_view(), name='partograph_detail'),
    # PDF export
    path('<int:pk>/partograph/pdf/', PartographPDFView.as_view(), name='partograph_pdf'),
]


