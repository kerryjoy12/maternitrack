from django.db import models
from django.conf import settings
from patients.models import Patient

class MaternalDeathReview(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mortality_reviews',
        help_text="The patient associated with this review (can be empty/anonymous)"
    )
    date_of_death = models.DateField(help_text="Date of death or near-miss event")
    cause_of_death = models.TextField(help_text="Immediate, underlying, or contributing causes of death")
    avoidable_factors = models.TextField(
        blank=True,
        help_text="Avoidable factors, missed opportunities, or lapses in care standards"
    )
    three_delays = models.TextField(
        blank=True,
        help_text="Delays at community (seeking care), transport (reaching facility), or institutional level (receiving care)"
    )
    recommendations = models.TextField(
        blank=True,
        help_text="Recommended remedial actions to prevent recurrence"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_death_reviews',
        help_text="Clinician who conducted/logged the review"
    )
    review_date = models.DateField(help_text="Date the clinical audit / review was conducted")
    is_near_miss = models.BooleanField(
        default=False,
        help_text="True if this is a maternal near-miss rather than a mortality event"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'maternal_mortality_reviews'
        ordering = ['-date_of_death', '-created_at']

    def __str__(self):
        type_str = "Near-Miss" if self.is_near_miss else "Death Review"
        patient_str = self.patient.full_name if self.patient else "Anonymous"
        return f"{type_str} — {patient_str} ({self.date_of_death})"
