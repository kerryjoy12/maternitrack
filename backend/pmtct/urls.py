from django.urls import path
from .views import PMTCTRecordListCreateView, PMTCTRecordDetailView

urlpatterns = [
    path('', PMTCTRecordListCreateView.as_view(), name='pmtct_list_create'),
    path('<int:pk>/', PMTCTRecordDetailView.as_view(), name='pmtct_detail'),
]
