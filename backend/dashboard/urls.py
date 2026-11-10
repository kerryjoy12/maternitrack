from django.urls import path
from .views import (
    DashboardSummaryView, DueSoonView, OverdueDeliveryView, RecentActivityView,
    TrendsView, PublicStatsView, NurseDashboardSummaryView, DoctorDashboardSummaryView
)

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('summary/nurse/', NurseDashboardSummaryView.as_view(), name='dashboard_summary_nurse'),
    path('summary/doctor/', DoctorDashboardSummaryView.as_view(), name='dashboard_summary_doctor'),
    path('due-soon/', DueSoonView.as_view(), name='due_soon'),
    path('overdue-delivery/', OverdueDeliveryView.as_view(), name='overdue_delivery'),
    path('recent-activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('trends/', TrendsView.as_view(), name='dashboard_trends'),
    path('public-stats/', PublicStatsView.as_view(), name='public_stats'),
]

