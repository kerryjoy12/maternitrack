from django.urls import path
from .views import (
    ClinicalNoteListCreateView, ClinicalNoteDetailView,
    PatientDocumentListCreateView, PatientDocumentDetailView,
    ANCVisitListCreateView, ANCVisitDetailView,
    ANCVisitPDFView, MotherANCVisitsView, MotherANCVisitDetailView,
)

urlpatterns = [
    path('notes/', ClinicalNoteListCreateView.as_view(), name='clinical_note_list'),
    path('notes/<int:pk>/', ClinicalNoteDetailView.as_view(), name='clinical_note_detail'),
    path('documents/', PatientDocumentListCreateView.as_view(), name='document_list'),
    path('documents/<int:pk>/', PatientDocumentDetailView.as_view(), name='document_detail'),
    path('anc-visits/', ANCVisitListCreateView.as_view(), name='anc_visit_list'),
    path('anc-visits/<int:pk>/', ANCVisitDetailView.as_view(), name='anc_visit_detail'),
    path('anc-visits/<int:pk>/pdf/', ANCVisitPDFView.as_view(), name='anc_visit_pdf'),
    
    # Mother portal endpoints
    path('mother/anc-visits/', MotherANCVisitsView.as_view(), name='mother_anc_visits'),
    path('mother/anc-visits/<int:pk>/', MotherANCVisitDetailView.as_view(), name='mother_anc_visit_detail'),
]
