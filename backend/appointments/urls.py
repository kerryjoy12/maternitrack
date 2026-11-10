from django.urls import path
from .views import (
    AppointmentListCreateView, AppointmentDetailView,
    MarkAttendedView, MarkMissedView, RescheduleView
)

urlpatterns = [
    path('', AppointmentListCreateView.as_view(), name='appointment_list_create'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment_detail'),
    path('<int:pk>/attend/', MarkAttendedView.as_view(), name='mark_attended'),
    path('<int:pk>/miss/', MarkMissedView.as_view(), name='mark_missed'),
    path('<int:pk>/reschedule/', RescheduleView.as_view(), name='reschedule'),
]
