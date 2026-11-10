from django.db import models
from datetime import date

try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


class ClinicalNote(models.Model):
    """
    Doctor/nurse clinical notes attached to a patient visit.
    Supports categorization (Consultation, Lab, Referral, etc.)
    """
    CATEGORY_CHOICES = [
        ('CONSULTATION', 'Consultation'),
        ('LAB_ORDER', 'Lab Order'),
        ('LAB_RESULT', 'Lab Result'),
        ('PRESCRIPTION', 'Prescription'),
        ('REFERRAL', 'Referral'),
        ('OBSERVATION', 'Observation'),
        ('DISCHARGE', 'Discharge Summary'),
    ]
    PRIORITY_CHOICES = [
        ('ROUTINE', 'Routine'),
        ('URGENT', 'Urgent'),
        ('STAT', 'STAT'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='clinical_notes'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='CONSULTATION')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='ROUTINE')
    title = models.CharField(max_length=200)
    content = models.TextField()
    diagnosis_codes = models.CharField(
        max_length=200, blank=True,
        help_text='Comma-separated ICD-10 codes (e.g. O14.1, O24.4)'
    )

    # Lab-specific fields
    lab_test_name = models.CharField(max_length=200, blank=True)
    lab_result_value = models.CharField(max_length=200, blank=True)
    lab_result_unit = models.CharField(max_length=50, blank=True)
    lab_reference_range = models.CharField(max_length=100, blank=True)
    lab_is_abnormal = models.BooleanField(default=False)

    # Prescription-specific fields
    medication_name = models.CharField(max_length=200, blank=True)
    dosage = models.CharField(max_length=100, blank=True)
    frequency = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=100, blank=True)

    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, related_name='authored_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.category}] {self.patient.full_name} — {self.title}"


class PatientDocument(models.Model):
    """
    File uploads (scans, lab PDFs, ultrasound images) for a patient.
    """
    DOCUMENT_TYPE_CHOICES = [
        ('LAB_REPORT', 'Lab Report'),
        ('ULTRASOUND', 'Ultrasound'),
        ('SCAN', 'Scan / X-Ray'),
        ('PRESCRIPTION', 'Prescription'),
        ('REFERRAL', 'Referral Letter'),
        ('CONSENT', 'Consent Form'),
        ('ID_DOCUMENT', 'ID Document'),
        ('OTHER', 'Other'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='documents'
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='OTHER')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='patient_documents/%Y/%m/')
    file_size_bytes = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)

    uploaded_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_documents'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.file and not self.file_size_bytes:
            try:
                self.file_size_bytes = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.document_type}] {self.patient.full_name} — {self.title}"

class ANCVisit(models.Model):
    """
    Structured Antenatal Care (ANC) visit data tracking.
    Contains full WHO-compliant EMR clinical assessment across 8 tabs.
    """
    VISIT_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('COMPLETED', 'Completed'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='anc_visits'
    )
    pregnancy = models.ForeignKey(
        'patients.Pregnancy', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='visits', help_text="Related pregnancy episode"
    )
    visit_number = models.PositiveIntegerField(help_text="e.g. 1 for ANC1, 2 for ANC2")
    visit_date = models.DateField(default=date.today)
    gestational_age_weeks = models.PositiveIntegerField(null=True, blank=True)
    department = models.CharField(max_length=100, default='Antenatal Care Clinic')
    visit_status = models.CharField(max_length=15, choices=VISIT_STATUS_CHOICES, default='COMPLETED')
    
    # ── Tab 1: Vital Signs & Measurements ──────────────────────────────────
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    bp_systolic = models.IntegerField(null=True, blank=True, help_text="Systolic BP in mmHg")
    bp_diastolic = models.IntegerField(null=True, blank=True, help_text="Diastolic BP in mmHg")
    pulse_rate = models.IntegerField(null=True, blank=True, help_text="Pulse rate in bpm")
    respiratory_rate = models.IntegerField(null=True, blank=True, help_text="Breaths per minute")
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="Temperature (°C)")
    oxygen_saturation = models.IntegerField(null=True, blank=True, help_text="SpO2 %")
    muac_cm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="MUAC (cm)")
    
    # ── Tab 2: Maternal & Fetal Assessment ──────────────────────────────────
    presenting_complaints = models.TextField(blank=True)
    general_examination = models.TextField(blank=True)
    OEDEMA_CHOICES = [
        ('NONE', 'None'),
        ('MILD', 'Mild (+)'),
        ('MODERATE', 'Moderate (++)'),
        ('SEVERE', 'Severe (+++)'),
    ]
    oedema = models.CharField(max_length=10, choices=OEDEMA_CHOICES, default='NONE')
    PALLOR_CHOICES = [
        ('NONE', 'None'),
        ('MILD', 'Mild'),
        ('MODERATE', 'Moderate'),
        ('SEVERE', 'Severe'),
    ]
    pallor = models.CharField(max_length=10, choices=PALLOR_CHOICES, default='NONE')
    fundal_height_cm = models.IntegerField(null=True, blank=True, help_text="Fundal height in cm")
    fetal_heart_rate = models.IntegerField(null=True, blank=True, help_text="Fetal heart rate in bpm")
    PRESENTATION_CHOICES = [
        ('CEPHALIC', 'Cephalic'),
        ('BREECH', 'Breech'),
        ('TRANSVERSE', 'Transverse'),
    ]
    fetal_presentation = models.CharField(max_length=15, choices=PRESENTATION_CHOICES, blank=True)
    FETAL_MOVEMENT_CHOICES = [
        ('NORMAL', 'Normal'),
        ('DECREASED', 'Decreased'),
        ('ABSENT', 'Absent'),
        ('NOT_APPLICABLE', 'Not Applicable'),
    ]
    fetal_movement = models.CharField(max_length=15, choices=FETAL_MOVEMENT_CHOICES, default='NORMAL')
    
    # ── Tab 3: Laboratory Investigations ────────────────────────────────────
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]
    blood_group_confirmed = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True, verbose_name="Blood Group")
    RHESUS_CHOICES = [('POSITIVE', 'Positive'), ('NEGATIVE', 'Negative'), ('UNKNOWN', 'Unknown')]
    rhesus_factor = models.CharField(max_length=10, choices=RHESUS_CHOICES, default='POSITIVE', blank=True)
    
    hemoglobin_gdl = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="Hemoglobin (g/dL)")
    ANEMIA_SEVERITY = [
        ('NORMAL', 'Normal'),
        ('MILD', 'Mild (10.0-10.9 g/dL)'),
        ('MODERATE', 'Moderate (7.0-9.9 g/dL)'),
        ('SEVERE', 'Severe (<7.0 g/dL)'),
    ]
    anemia_severity = models.CharField(max_length=15, choices=ANEMIA_SEVERITY, blank=True)
    
    blood_sugar_mgdl = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, verbose_name="Blood Sugar (mg/dL)")
    blood_sugar_type = models.CharField(max_length=20, choices=[
        ('FASTING', 'Fasting'),
        ('RANDOM', 'Random'),
        ('POSTPRANDIAL', 'Postprandial'),
        ('OGTT', 'OGTT'),
    ], blank=True)
    
    URINE_PROTEIN_CHOICES = [('NIL', 'Nil'), ('TRACE', 'Trace'), ('+', '+'), ('++', '++'), ('+++', '+++')]
    urine_protein = models.CharField(max_length=5, choices=URINE_PROTEIN_CHOICES, default='NIL')
    urine_glucose = models.CharField(max_length=5, choices=URINE_PROTEIN_CHOICES, default='NIL')
    urine_ketones = models.CharField(max_length=5, choices=URINE_PROTEIN_CHOICES, default='NIL')
    urine_leukocytes = models.CharField(max_length=5, choices=URINE_PROTEIN_CHOICES, default='NIL')
    urine_nitrites = models.CharField(max_length=10, choices=[('NEGATIVE', 'Negative'), ('POSITIVE', 'Positive')], default='NEGATIVE')
    
    # Infection Screenings & WHO Antenatal Profile
    TB_SCREENING_CHOICES = [('NEGATIVE', 'Negative'), ('POSITIVE', 'Positive'), ('NOT_TESTED', 'Not Tested')]
    tb_screening_outcome = models.CharField(max_length=15, choices=TB_SCREENING_CHOICES, default='NOT_TESTED')
    ipt_date_given = models.DateField(null=True, blank=True, verbose_name="IPT Date Given")
    ipt_next_visit = models.DateField(null=True, blank=True, verbose_name="IPT Next Visit Date")
    
    TRIPLE_TEST_CHOICES = [
        ('NON-REACTIVE', 'Non-Reactive'),
        ('REACTIVE', 'Reactive'),
        ('INCONCLUSIVE', 'Inconclusive'),
        ('NOT_TESTED', 'Not Tested'),
    ]
    hiv_status = models.CharField(max_length=15, choices=TRIPLE_TEST_CHOICES, default='NOT_TESTED', verbose_name="HIV Status")
    hiv_retest_date = models.DateField(null=True, blank=True, verbose_name="HIV Non-Reactive Retest Date")
    syphilis_status = models.CharField(max_length=15, choices=TRIPLE_TEST_CHOICES, default='NOT_TESTED', verbose_name="Syphilis Status")
    hepatitis_b_surface_ag = models.CharField(max_length=15, choices=TRIPLE_TEST_CHOICES, default='NOT_TESTED', verbose_name="Hepatitis B Surface Ag")
    rubella_igg = models.CharField(max_length=20, choices=[
        ('IMMUNE', 'Immune'),
        ('NON-IMMUNE', 'Non-Immune'),
        ('NOT_TESTED', 'Not Tested'),
    ], default='NOT_TESTED', verbose_name="Rubella IgG")
    
    couple_hiv_testing_done = models.BooleanField(default=False)
    partner_hiv_status = models.CharField(max_length=15, choices=TRIPLE_TEST_CHOICES, default='NOT_TESTED')
    
    # ── Tab 4: Obstetric Ultrasound ──────────────────────────────────────────
    ultrasound_done = models.BooleanField(default=False)
    scan_date = models.DateField(null=True, blank=True)
    ultrasound_gestational_age = models.PositiveIntegerField(null=True, blank=True)
    placenta_location = models.CharField(max_length=100, blank=True)
    fetal_position = models.CharField(max_length=100, blank=True)
    estimated_fetal_weight_g = models.PositiveIntegerField(null=True, blank=True)
    AMNIOTIC_FLUID_CHOICES = [
        ('NORMAL', 'Normal'),
        ('OLIGOHYDRAMNIOS', 'Oligohydramnios'),
        ('POLYHYDRAMNIOS', 'Polyhydramnios'),
    ]
    amniotic_fluid = models.CharField(max_length=20, choices=AMNIOTIC_FLUID_CHOICES, blank=True)
    num_fetuses_seen = models.PositiveIntegerField(default=1)
    ultrasound_results = models.TextField(blank=True, help_text="Ultrasound findings if performed")
    
    # ── Tab 5: Clinical Consultation & Notes ─────────────────────────────────
    consultation_notes = models.TextField(blank=True)
    assessment = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    complications_noted = models.TextField(blank=True)
    general_notes = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    # ── Tab 6: Prescriptions & Medications ───────────────────────────────────
    medication_prescribed = models.TextField(blank=True)
    supplements_given = models.TextField(blank=True)
    health_education_given = models.TextField(blank=True)
    
    # ── Tab 7: Referrals ─────────────────────────────────────────────────────
    referral_facility = models.CharField(max_length=200, blank=True)
    referral_reason = models.TextField(blank=True)
    referral_date = models.DateField(null=True, blank=True)
    REFERRAL_STATUS_CHOICES = [
        ('NONE', 'None'),
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    referral_status = models.CharField(max_length=15, choices=REFERRAL_STATUS_CHOICES, default='NONE')
    
    # ── Tab 8: Next Appointment & Reminders ──────────────────────────────────
    next_appointment_date = models.DateField(null=True, blank=True)
    REMINDER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DISABLED', 'Disabled'),
    ]
    reminder_status = models.CharField(max_length=15, choices=REMINDER_STATUS_CHOICES, default='PENDING')
    send_sms_reminder = models.BooleanField(default=True)
    send_email_reminder = models.BooleanField(default=True)

    # Link to appointment
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='anc_visit'
    )
    attending_staff = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, related_name='anc_consultations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'anc_visits'
        ordering = ['-visit_date', '-created_at']
        verbose_name = 'ANC Visit'
        verbose_name_plural = 'ANC Visits'

    def __str__(self):
        return f"ANC Visit {self.visit_number} - {self.patient.full_name} on {self.visit_date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.appointment and self.appointment.status != 'ATTENDED':
            self.appointment.status = 'ATTENDED'
            self.appointment.attended_date = self.visit_date
            self.appointment.save(update_fields=['status', 'attended_date'])

    def get_lab_results_summary(self):
        """Return a formatted summary of all lab results for this visit."""
        results = []
        if self.hemoglobin_gdl is not None:
            results.append(f"Hemoglobin: {self.hemoglobin_gdl} g/dL ({self.get_anemia_severity_display() if self.anemia_severity else 'N/A'})")
        if self.blood_sugar_mgdl is not None:
            results.append(f"Blood Sugar: {self.blood_sugar_mgdl} mg/dL ({self.get_blood_sugar_type_display() if self.blood_sugar_type else 'N/A'})")
        if self.urine_protein and self.urine_protein != 'NIL':
            results.append(f"Urine Protein: {self.urine_protein}")
        if self.hiv_status:
            results.append(f"HIV: {self.get_hiv_status_display()}")
        if self.syphilis_status:
            results.append(f"Syphilis: {self.get_syphilis_status_display()}")
        if self.hepatitis_b_surface_ag and self.hepatitis_b_surface_ag != 'NOT_TESTED':
            results.append(f"Hepatitis B: {self.get_hepatitis_b_surface_ag_display()}")
        if self.rubella_igg and self.rubella_igg != 'NOT_TESTED':
            results.append(f"Rubella: {self.get_rubella_igg_display()}")
        if self.blood_group_confirmed:
            results.append(f"Blood Group: {self.get_blood_group_confirmed_display()}")
        return '; '.join(results) if results else 'No lab results recorded'
