"""
supabase_services/realtime_service.py
───────────────────────────────────────
Broadcasts events via Aiven Redis Pub/Sub and records them in the local database.

No websocket connection is held open on the Django side — Django
simply writes to the DB and publishes to Aiven Redis, and the async SSE View
streams the change out to all subscribed browser clients.

Channel naming convention (Redis):
  maternity_realtime_events
"""
import logging
import json
import redis
from typing import Optional
from django.conf import settings
from core.models import (
    RealtimeStaffNotification,
    RealtimeClinicalAlert,
    RealtimePatientMessage,
    RealtimeAppointmentEvent
)

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Thin wrapper that broadcasts domain events by inserting rows into
    local PostgreSQL tables and publishing them to Aiven Redis.
    """

    @classmethod
    def _publish(cls, event_type: str, payload: dict):
        """Helper to publish event data to Redis Pub/Sub."""
        try:
            redis_url = getattr(settings, 'REDIS_URL', settings.CELERY_BROKER_URL)
            r = redis.from_url(redis_url)
            message = {
                'event_type': event_type,
                'payload': payload
            }
            r.publish('maternity_realtime_events', json.dumps(message))
            r.close()
        except Exception as exc:
            logger.error('Failed to publish real-time event to Redis: %s', exc)

    # ── Staff / clinical notifications ────────────────────────────────────────

    @classmethod
    def notify_staff(
        cls,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = 'INFO',
        patient_id: Optional[int] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        """
        Insert a row into realtime_staff_notifications and publish to Redis.
        """
        try:
            notif = RealtimeStaffNotification.objects.create(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                patient_id=patient_id,
                metadata=metadata,
                is_read=False
            )
            payload = {
                'id': notif.id,
                'user_id': str(notif.user_id),
                'title': notif.title,
                'message': notif.message,
                'notification_type': notif.notification_type,
                'patient_id': notif.patient_id,
                'metadata': notif.metadata,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat(),
            }
            cls._publish('staff_notification', payload)
        except Exception as exc:
            logger.error('RealtimeService.notify_staff failed: %s', exc)

    @classmethod
    def broadcast_alert(
        cls,
        alert_type: str,
        severity: str,
        patient_id: int,
        message: str,
        recipient_roles: Optional[list] = None,
    ) -> None:
        """
        Broadcast a clinical alert to all staff of specified roles.
        If recipient_roles is None, broadcasts to all staff.
        """
        try:
            alert = RealtimeClinicalAlert.objects.create(
                alert_type=alert_type,
                severity=severity,
                patient_id=patient_id,
                message=message,
                recipient_roles=recipient_roles or ['ADMIN', 'NURSE', 'DOCTOR'],
                acknowledged=False
            )
            payload = {
                'id': alert.id,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'patient_id': alert.patient_id,
                'message': alert.message,
                'recipient_roles': alert.recipient_roles,
                'acknowledged': alert.acknowledged,
                'created_at': alert.created_at.isoformat(),
            }
            cls._publish('clinical_alert', payload)
        except Exception as exc:
            logger.error('RealtimeService.broadcast_alert failed: %s', exc)

    # ── Patient messaging ─────────────────────────────────────────────────────

    @classmethod
    def send_patient_message(
        cls,
        sender_id: int,
        patient_id: int,
        message: str,
        message_type: str = 'GENERAL',
        recipient_id: Optional[int] = None,
    ) -> None:
        """
        Insert a secure message row and publish to Redis.
        """
        try:
            msg = RealtimePatientMessage.objects.create(
                sender_id=sender_id,
                recipient_id=recipient_id,
                patient_id=patient_id,
                message=message,
                message_type=message_type,
                is_read=False
            )
            payload = {
                'id': msg.id,
                'sender_id': str(msg.sender_id),
                'recipient_id': str(msg.recipient_id) if msg.recipient_id else None,
                'patient_id': msg.patient_id,
                'message': msg.message,
                'message_type': msg.message_type,
                'is_read': msg.is_read,
                'created_at': msg.created_at.isoformat(),
            }
            cls._publish('patient_message', payload)
        except Exception as exc:
            logger.error('RealtimeService.send_patient_message failed: %s', exc)

    # ── Appointment updates ───────────────────────────────────────────────────

    @classmethod
    def appointment_updated(
        cls,
        appointment_id: int,
        patient_id: int,
        new_status: str,
        scheduled_date: str,
        appointment_type: str,
    ) -> None:
        """
        Insert an appointment change event row and publish to Redis.
        """
        try:
            event = RealtimeAppointmentEvent.objects.create(
                appointment_id=appointment_id,
                patient_id=patient_id,
                new_status=new_status,
                scheduled_date=scheduled_date,
                appointment_type=appointment_type
            )
            payload = {
                'id': event.id,
                'appointment_id': event.appointment_id,
                'patient_id': event.patient_id,
                'new_status': event.new_status,
                'scheduled_date': str(event.scheduled_date),
                'appointment_type': event.appointment_type,
                'created_at': event.created_at.isoformat(),
            }
            cls._publish('appointment_event', payload)
        except Exception as exc:
            logger.error('RealtimeService.appointment_updated failed: %s', exc)
