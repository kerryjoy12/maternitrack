from django.db import models


class ClinicalAlert(models.Model):
    """
    A clinical safety alert generated automatically when a partograph
    observation crosses a dangerous threshold (e.g. abnormal FHR, BP crisis,
    labour crossing the WHO action line).

    Deduplication: only one unacknowledged alert of the same type per patient
    is created within the configured ALERT_DEDUP_MINUTES window (default 120).
    """

    class AlertType(models.TextChoices):
        FHR_LOW               = 'FHR_LOW',              'Fetal Heart Rate — Low (<110 bpm)'
        FHR_HIGH              = 'FHR_HIGH',             'Fetal Heart Rate — High (>160 bpm)'
        BP_CRITICAL           = 'BP_CRITICAL',          'Blood Pressure — Critical'
        ACTION_LINE_CROSSED   = 'ACTION_LINE_CROSSED',  'Labour — Action Line Crossed'
        ALERT_LINE_CROSSED    = 'ALERT_LINE_CROSSED',   'Labour — Alert Line Crossed'
        PROLONGED_LABOUR      = 'PROLONGED_LABOUR',     'Prolonged Labour (>12 h)'
        TEMP_HIGH             = 'TEMP_HIGH',            'Maternal Temperature — High (>38°C)'
        PATIENT_SYMPTOM_REPORT = 'PATIENT_SYMPTOM_REPORT', 'Patient Symptom Report (Mother Portal)'
        PATIENT_MESSAGE       = 'PATIENT_MESSAGE',      'Patient Message (Mother Portal)'
        ANEMIA_ALERT          = 'ANEMIA_ALERT',         'Anaemia Alert (Hb < 10 g/dL)'
        PRE_ECLAMPSIA_ALERT   = 'PRE_ECLAMPSIA_ALERT',  'Possible Pre-eclampsia (BP >= 140/90)'
        HIV_POSITIVE_ALERT    = 'HIV_POSITIVE_ALERT',   'HIV Positive — ART Referral Recommended'
        TB_POSITIVE_ALERT     = 'TB_POSITIVE_ALERT',    'TB Screening Positive — TB Treatment Workflow'
        SYPHILIS_POSITIVE_ALERT = 'SYPHILIS_POSITIVE_ALERT', 'Syphilis Reactive — Treatment Recommended'
        POST_TERM_ALERT       = 'POST_TERM_ALERT',      'Post-term Pregnancy (> 41 Weeks)'
        OVERDUE_APPOINTMENT_ALERT = 'OVERDUE_APPOINTMENT_ALERT', 'Overdue Antenatal Care Appointment'

    class Severity(models.TextChoices):
        WARNING  = 'WARNING',  'Warning'
        CRITICAL = 'CRITICAL', 'Critical'

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='clinical_alerts'
    )
    partograph_entry = models.ForeignKey(
        'patients.PartographEntry', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='alerts'
    )
    symptom_report = models.ForeignKey(
        'patients.SymptomReport', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='clinical_alerts',
    )
    alert_type  = models.CharField(max_length=30, choices=AlertType.choices)
    severity    = models.CharField(max_length=10, choices=Severity.choices, default=Severity.WARNING)
    value_triggered = models.CharField(
        max_length=50, blank=True,
        help_text='The actual value that triggered this alert (e.g. "105 bpm")'
    )
    threshold = models.CharField(
        max_length=50, blank=True,
        help_text='The threshold that was breached (e.g. "<110 bpm")'
    )
    message = models.TextField(blank=True)

    # Acknowledgement
    acknowledged    = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinical_alerts'
        ordering = ['-created_at']
        verbose_name = 'Clinical Alert'
        verbose_name_plural = 'Clinical Alerts'
        indexes = [
            models.Index(fields=['patient', 'alert_type', 'acknowledged']),
            models.Index(fields=['acknowledged', 'created_at']),
        ]

    def __str__(self):
        return f'[{self.severity}] {self.get_alert_type_display()} — {self.patient}'


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=ClinicalAlert)
def broadcast_clinical_alert_on_save(sender, instance, created, **kwargs):
    from django.conf import settings
    if getattr(settings, 'TESTING', False):
        return
    if created:
        try:
            from supabase_services import realtime
            realtime.broadcast_alert(
                alert_type=instance.alert_type,
                severity=instance.severity,
                patient_id=instance.patient_id,
                message=instance.message,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Failed to broadcast clinical alert: %s", exc)


