from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import Http404
from django.shortcuts import get_object_or_404
from core.permissions import IsAdminRole, IsDoctorRole, IsNurseRole
from .models import Ticket, Notification
from .serializers import (
    TicketCreateSerializer,
    TicketSerializer,
    TicketStatusUpdateSerializer,
    NotificationSerializer,
)
from .services import create_ticket_notification, create_admin_reply_notification
from .models import Ticket, Notification, TicketReply
from .serializers import TicketReplyCreateSerializer, TicketReplySerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class TicketCreateView(generics.CreateAPIView):
    serializer_class = TicketCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorRole | IsNurseRole]

    def perform_create(self, serializer):
        ticket = serializer.save()
        create_ticket_notification(ticket)


class TicketListView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Ticket.objects.select_related('created_by', 'patient')
        user = self.request.user
        if getattr(user, 'role', None) == 'ADMIN':
            return queryset.order_by('-created_at')
        return queryset.filter(created_by=user).order_by('-created_at')


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Ticket.objects.select_related('created_by', 'patient')

    def get_object(self):
        obj = super().get_object()
        if getattr(self.request.user, 'role', None) == 'ADMIN':
            return obj
        if obj.created_by != self.request.user:
            raise Http404('Not found.')
        return obj


class TicketStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        serializer = TicketStatusUpdateSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TicketSerializer(ticket).data)


class TicketReplyCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        # enforce one-time reply
        if ticket.replies.exists():
            return Response({'detail': 'A reply has already been posted for this ticket.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TicketReplyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reply = TicketReply.objects.create(
            ticket=ticket,
            author=request.user,
            message=serializer.validated_data['message'],
        )

        # notify ticket creator
        try:
            create_admin_reply_notification(reply)
        except Exception:
            pass

        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.select_related('user', 'ticket').filter(user=self.request.user)
        if self.request.query_params.get('unread') in ['true', '1', 'yes']:
            queryset = queryset.filter(is_read=False)
        return queryset.order_by('-created_at')


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'marked_all_read': True})


class UnresolvedTicketCountView(APIView):
    """Return number of unresolved tickets (for admin dashboard badge)."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        count = Ticket.objects.exclude(status='RESOLVED').count()
        return Response({'unresolved_count': count})


class UnreadNotificationCountView(APIView):
    """Return unread notification count for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
