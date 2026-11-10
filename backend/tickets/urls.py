from django.urls import path
from .views import (
    TicketCreateView,
    TicketListView,
    TicketDetailView,
    TicketStatusUpdateView,
    TicketReplyCreateView,
    NotificationListView,
    NotificationReadView,
    NotificationMarkAllReadView,
    UnreadNotificationCountView,
    UnresolvedTicketCountView,
)

urlpatterns = [
    path('create/', TicketCreateView.as_view(), name='ticket_create'),
    path('', TicketListView.as_view(), name='ticket_list'),
    path('<int:pk>/', TicketDetailView.as_view(), name='ticket_detail'),
    path('<int:pk>/status/', TicketStatusUpdateView.as_view(), name='ticket_status_update'),
    path('<int:pk>/reply/', TicketReplyCreateView.as_view(), name='ticket_reply'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification_read'),
    path('notifications/read_all/', NotificationMarkAllReadView.as_view(), name='notification_read_all'),
    path('notifications/unread_count/', UnreadNotificationCountView.as_view(), name='notification_unread_count'),
    path('unresolved_count/', UnresolvedTicketCountView.as_view(), name='ticket_unresolved_count'),
]
