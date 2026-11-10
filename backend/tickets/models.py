from django.db import models
from django.conf import settings


class Ticket(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tickets',
    )
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.email}: {self.message[:40]}"


class TicketReply(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='replies',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_replies',
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_replies'
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author} on {self.ticket_id}: {self.message[:40]}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Notification)
def broadcast_notification_on_save(sender, instance, created, **kwargs):
    from django.conf import settings
    if getattr(settings, 'TESTING', False):
        return
    if created:
        try:
            from supabase_services import realtime
            realtime.notify_staff(
                user_id=str(instance.user_id),
                title="Notification",
                message=instance.message,
                notification_type="INFO",
                patient_id=instance.ticket.patient_id if (instance.ticket and instance.ticket.patient_id) else None,
                metadata={"ticket_id": instance.ticket_id} if instance.ticket_id else None,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Failed to broadcast notification: %s", exc)


