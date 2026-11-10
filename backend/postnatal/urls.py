from django.urls import path
from .views import PostnatalListCreateView, PostnatalDetailView, Mark7DayAttendedView, Mark6WeekAttendedView

urlpatterns = [
    path('', PostnatalListCreateView.as_view(), name='postnatal_list_create'),
    path('<int:pk>/', PostnatalDetailView.as_view(), name='postnatal_detail'),
    path('<int:pk>/7day-attended/', Mark7DayAttendedView.as_view(), name='mark_7day'),
    path('<int:pk>/6week-attended/', Mark6WeekAttendedView.as_view(), name='mark_6week'),
]
