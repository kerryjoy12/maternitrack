from django.db import models
from django.conf import settings

class RealtimeStaffNotification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='realtime_notifications',
        db_column='user_id'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='INFO')
    patient_id = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'realtime_staff_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.email}: {self.title}"


class RealtimeClinicalAlert(models.Model):
    alert_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=50, default='WARNING')
    patient_id = models.BigIntegerField()
    message = models.TextField()
    recipient_roles = models.JSONField(default=list)  # Stored as JSON list of roles
    acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'realtime_clinical_alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Clinical Alert: {self.alert_type} (Severity: {self.severity})"


class RealtimePatientMessage(models.Model):
    sender_id = models.UUIDField()
    recipient_id = models.UUIDField(null=True, blank=True)
    patient_id = models.BigIntegerField()
    message = models.TextField()
    message_type = models.CharField(max_length=50, default='GENERAL')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'realtime_patient_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Patient Message (Patient: {self.patient_id}): {self.message[:30]}"


class RealtimeAppointmentEvent(models.Model):
    appointment_id = models.BigIntegerField()
    patient_id = models.BigIntegerField()
    new_status = models.CharField(max_length=50)
    scheduled_date = models.DateField()
    appointment_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'realtime_appointment_events'
        ordering = ['-created_at']

    def __str__(self):
        return f"Appointment Event (ID: {self.appointment_id}): {self.new_status}"
