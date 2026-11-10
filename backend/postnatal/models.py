from django.db import models
try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


class PostnatalRecord(models.Model):
    DELIVERY_TYPE_CHOICES = [
        ('NORMAL', 'Normal/Vaginal'),
        ('CAESAREAN', 'Caesarean Section'),
        ('ASSISTED', 'Assisted Delivery'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='postnatal_records'
    )
    pregnancy_number = models.PositiveIntegerField(
        default=1,
        help_text='Sequential pregnancy number for this patient (1, 2, 3...)',
    )
    delivery_date = models.DateField()
    delivery_type = models.CharField(max_length=15, choices=DELIVERY_TYPE_CHOICES)
    baby_first_name = models.CharField(max_length=100, blank=True)
    baby_last_name = models.CharField(max_length=100, blank=True)
    baby_weight_kg = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    baby_gender = models.CharField(max_length=10, choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('UNKNOWN', 'Unknown')], default='UNKNOWN')
    apgar_score_1min = models.IntegerField(null=True, blank=True, help_text="APGAR score at 1 minute (0-10)")
    apgar_score_5min = models.IntegerField(null=True, blank=True, help_text="APGAR score at 5 minutes (0-10)")
    mother_condition = models.CharField(max_length=200, blank=True)
    baby_condition = models.CharField(max_length=200, blank=True)
    postpartum_complications = models.TextField(blank=True, help_text="Record any PPH, infections, or other complications.")
    
    # Mental Health & Recovery
    mental_health_screening = models.TextField(blank=True, help_text="Postpartum depression screening notes")

    # Review tracking
    review_7day_date = models.DateField(null=True, blank=True)
    review_7day_attended = models.BooleanField(default=False)
    review_7day_notes = models.TextField(blank=True)

    review_6week_date = models.DateField(null=True, blank=True)
    review_6week_attended = models.BooleanField(default=False)
    review_6week_notes = models.TextField(blank=True)

    # Baby immunizations
    bcg_given = models.BooleanField(default=False)
    bcg_date = models.DateField(null=True, blank=True)
    opv0_given = models.BooleanField(default=False)
    opv0_date = models.DateField(null=True, blank=True)
    hep_b_given = models.BooleanField(default=False)
    hep_b_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='postnatal_records'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'postnatal_records'
        unique_together = [('patient', 'pregnancy_number')]
        ordering = ['-delivery_date']

    def save(self, *args, **kwargs):
        from datetime import timedelta
        # Auto-assign next pregnancy number if creating new
        if not self.pk and not self.pregnancy_number:
            last = PostnatalRecord.objects.filter(
                patient=self.patient
            ).order_by('-pregnancy_number').first()
            self.pregnancy_number = (last.pregnancy_number + 1) if last else 1

        # Auto-calculate review dates if not set
        if self.delivery_date:
            if not self.review_7day_date:
                self.review_7day_date = self.delivery_date + timedelta(days=7)
            if not self.review_6week_date:
                self.review_6week_date = self.delivery_date + timedelta(weeks=6)
        super().save(*args, **kwargs)
        # Update patient stage
        self.patient.clinic_stage = 'POSTNATAL'
        self.patient.save()

        # Trigger EHR push after transaction commits
        from django.db import transaction
        from postnatal.tasks import push_postnatal_record_to_ehr_task
        transaction.on_commit(lambda: push_postnatal_record_to_ehr_task.delay(self.pk))

    @property
    def review_7day_overdue(self):
        from datetime import date
        if self.review_7day_date and not self.review_7day_attended:
            return self.review_7day_date < date.today()
        return False

    @property
    def review_6week_overdue(self):
        from datetime import date
        if self.review_6week_date and not self.review_6week_attended:
            return self.review_6week_date < date.today()
        return False

    def __str__(self):
        return f"Postnatal #{self.pregnancy_number}: {self.patient.full_name} — {self.delivery_date}"
