from django.db import models
from django.conf import settings
from patients.models import Patient

class PMTCTRecord(models.Model):
    HIV_STATUS_CHOICES = [
        ('POSITIVE', 'HIV Positive'),
        ('NEGATIVE', 'HIV Negative'),
        ('UNKNOWN', 'Unknown'),
        ('DECLINED_TEST', 'Declined Test'),
    ]

    DISCLOSURE_CHOICES = [
        ('DISCLOSED', 'Disclosed'),
        ('NOT_DISCLOSED', 'Not Disclosed'),
    ]

    patient = models.OneToOneField(
        Patient,
        on_delete=models.CASCADE,
        related_name='pmtct_record',
        help_text="Patient linked to this PMTCT registry record"
    )
    hiv_status = models.CharField(
        max_length=20,
        choices=HIV_STATUS_CHOICES,
        default='UNKNOWN'
    )
    test_date = models.DateField(null=True, blank=True, help_text="Date of HIV test")
    arv_regimen = models.CharField(
        max_length=100,
        blank=True,
        help_text="ARV Regimen prescribed (if positive)"
    )
    arv_start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date ARV regimen was started"
    )
    viral_load = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Latest viral load value (copies/ml)"
    )
    viral_load_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of latest viral load test"
    )
    cd4_count = models.IntegerField(
        null=True,
        blank=True,
        help_text="CD4 cell count (cells/mm3)"
    )
    infant_prophylaxis = models.BooleanField(
        default=False,
        help_text="True if infant ARV prophylaxis was administered"
    )
    infant_test_at_6wk = models.CharField(
        max_length=50,
        blank=True,
        help_text="Infant PCR test outcome at 6 weeks"
    )
    infant_test_at_18mo = models.CharField(
        max_length=50,
        blank=True,
        help_text="Infant antibody test outcome at 18 months"
    )
    disclosure_status = models.CharField(
        max_length=20,
        choices=DISCLOSURE_CHOICES,
        default='NOT_DISCLOSED'
    )
    counselor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='counseled_pmtct_records',
        help_text="Staff counselor or clinician"
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pmtct_records'
        verbose_name = 'PMTCT Record'
        verbose_name_plural = 'PMTCT Records'

    def __str__(self):
        return f"PMTCT: {self.patient.full_name} — {self.hiv_status}"
