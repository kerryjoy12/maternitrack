import logging
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .models import Ticket, Notification
from users.models import StaffUser

logger = logging.getLogger(__name__)


def _normalize_phone(phone: str) -> str:
    phone = phone.strip()
    if phone.startswith('0') and len(phone) == 10:
        return '+254' + phone[1:]
    if phone.startswith('254') and not phone.startswith('+'):
        return '+' + phone
    if not phone.startswith('+'):
        return phone
    return phone


@transaction.atomic
def create_ticket_notification(ticket: Ticket) -> None:
    """Create admin notifications and attempt to send an SMS alert."""
    admins = StaffUser.objects.filter(role='ADMIN', is_active=True)
    if not admins.exists():
        logger.warning('No active admin user found to notify for ticket %s', ticket.pk)
        return

    message = (
        f"New clinical ticket created: {ticket.title} ({ticket.get_priority_display()}). "
        f"Status: {ticket.get_status_display()}."
    )

    # Create a notification entry for each admin
    for admin in admins:
        Notification.objects.create(
            user=admin,
            ticket=ticket,
            message=message,
        )

    # Attempt to send an SMS to each admin using their profile phone_number.
    # Fall back to the global ADMIN_PHONE_NUMBER if an admin has no phone configured.
    try:
        from reminders.sms_service import send_sms

        sms_message = (
            f"[MATERNITY TICKET] {ticket.title} - priority {ticket.get_priority_display()}. "
            f"Please review the ticket in the admin dashboard."
        )

        global_fallback = getattr(settings, 'ADMIN_PHONE_NUMBER', '')
        for admin in admins:
            phone = (getattr(admin, 'phone_number', '') or global_fallback).strip()
            if not phone:
                logger.info('No phone configured for admin %s; skipping SMS for that admin', admin.email)
                continue

            try:
                normalized = _normalize_phone(phone)
            except Exception:
                normalized = phone

            result = send_sms(normalized, sms_message)
            if not result.get('success'):
                logger.warning('Ticket SMS alert failed for admin %s (%s): %s', admin.email, normalized, result.get('error'))
    except Exception as exc:
        logger.error('Failed to send ticket SMS notifications: %s', exc)


def create_admin_reply_notification(reply) -> None:
    """Notify the ticket creator that an admin replied to their ticket."""
    ticket = reply.ticket
    user = ticket.created_by
    message = f"Admin replied to your ticket '{ticket.title}': {reply.message}"

    try:
        Notification.objects.create(
            user=user,
            ticket=ticket,
            message=message,
        )
    except Exception as exc:
        logger.warning('Failed to create reply notification DB record: %s', exc)

    # Attempt SMS if user has phone_number
    try:
        from reminders.sms_service import send_sms

        phone = (getattr(user, 'phone_number', '') or '').strip()
        if phone:
            try:
                normalized = _normalize_phone(phone)
            except Exception:
                normalized = phone

            sms_message = f"[MATERNITY TICKET REPLY] {ticket.title}: {reply.message[:160]}"
            result = send_sms(normalized, sms_message)
            if not result.get('success'):
                logger.warning('Reply SMS failed for user %s (%s): %s', user.email, normalized, result.get('error'))
    except Exception as exc:
        logger.info('Failed to send reply SMS (ignored): %s', exc)
