from django.db import models


class ReminderLog(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    PROVIDER_CHOICES = [
        ('AFRICAS_TALKING', "Africa's Talking"),
        ('TWILIO', 'Twilio'),
        ('SMTP', 'SMTP Email'),
        ('MANUAL', 'Manual'),
    ]
    CHANNEL_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
    ]

    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.CASCADE,
        related_name='reminder_logs', null=True, blank=True
    )
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='reminders'
    )
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='SMS')
    phone_number = models.CharField(max_length=15, blank=True)
    email_address = models.EmailField(blank=True, null=True)
    message_body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    delivery_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='AFRICAS_TALKING')
    error_message = models.TextField(blank=True)
    sent_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_reminders'
    )

    class Meta:
        db_table = 'reminder_logs'
        ordering = ['-sent_at']

    def __str__(self):
        return f"Reminder to {self.patient.full_name} at {self.sent_at}"
