from django.db import models, transaction
from datetime import date, timedelta
from core.fields import EncryptedCharField
import hashlib
try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


def generate_patient_number():
    """Atomically generate a unique patient number in format MAT-001."""
    with transaction.atomic():
        last = Patient.objects.select_for_update().order_by('-id').first()
        if last and last.patient_number:
            try:
                num = int(last.patient_number.split('-')[1]) + 1
            except (IndexError, ValueError):
                num = 1
        else:
            num = 1
        return f'MAT-{num:03d}'


class Patient(models.Model):
    CLINIC_STAGE_CHOICES = [
        ('ANC1', 'ANC Visit 1'),
        ('ANC2', 'ANC Visit 2'),
        ('ANC3', 'ANC Visit 3'),
        ('ANC4', 'ANC Visit 4'),
        ('DELIVERED', 'Delivered'),
        ('POSTNATAL', 'Postnatal'),
    ]
    RISK_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
    ]
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    GENDER_CHOICES = [
        ('FEMALE', 'Female'),
        ('MALE', 'Male'),
        ('OTHER', 'Other'),
    ]
    MARITAL_STATUS_CHOICES = [
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('COHABITING', 'Cohabiting'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed'),
    ]
    EDUCATION_LEVEL_CHOICES = [
        ('NONE', 'None'),
        ('PRIMARY', 'Primary'),
        ('SECONDARY', 'Secondary'),
        ('TERTIARY', 'Tertiary'),
        ('UNIVERSITY', 'University'),
        ('OTHER', 'Other'),
    ]
    REGISTRATION_STAGE_CHOICES = [
        ('NEW', 'New Registration'),
        ('IDENTITY_CAPTURED', 'Identity Captured'),
        ('PROFILE_COMPLETE', 'Profile Complete'),
        ('VERIFIED', 'Verified'),
        ('UPDATED', 'Updated'),
    ]

    patient_number = models.CharField(max_length=20, unique=True, blank=True)
    full_name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100, blank=True)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    preferred_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='FEMALE')
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, default='SINGLE')
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVEL_CHOICES, blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    spouse_name = models.CharField(max_length=200, blank=True)
    spouse_phone = models.CharField(max_length=15, blank=True)
    # MCH Handbook facility & clinical details
    health_facility_name = models.CharField(max_length=255, blank=True)
    kmhfl_code = models.CharField(max_length=50, blank=True)
    anc_number = models.CharField(max_length=50, blank=True)
    pnc_number = models.CharField(max_length=50, blank=True)
    gravida = models.PositiveIntegerField(null=True, blank=True)
    parity = models.PositiveIntegerField(null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estate_house_number = models.CharField(max_length=100, blank=True)
    national_id = EncryptedCharField(blank=True, null=True, verbose_name="National ID")
    nhif_number = EncryptedCharField(blank=True, null=True, verbose_name="NHIF Number")
    phone_number = EncryptedCharField()
    email = models.EmailField(blank=True, null=True)
    next_of_kin_name = models.CharField(max_length=200, blank=True)
    next_of_kin_phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    lmp = models.DateField(verbose_name='Last Menstrual Period', null=True, blank=True)
    edd = models.DateField(verbose_name='Expected Delivery Date', null=True, blank=True)
    clinic_stage = models.CharField(max_length=20, choices=CLINIC_STAGE_CHOICES, default='ANC1')
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='LOW')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, default='O+')
    RHESUS_CHOICES = [
        ('POSITIVE', 'Positive'),
        ('NEGATIVE', 'Negative'),
        ('UNKNOWN', 'Unknown'),
    ]
    rhesus_factor = models.CharField(max_length=10, choices=RHESUS_CHOICES, default='POSITIVE', blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True, help_text="SHA / NHIF / Private Insurance")
    LANG_CHOICES = [
        ('en', 'English'),
        ('sw', 'Swahili'),
    ]
    lang = models.CharField(max_length=2, choices=LANG_CHOICES, default='en', verbose_name='Preferred Language')
    
    # MCH Handbook Medical & Surgical History details
    has_diabetes = models.BooleanField(default=False)
    has_hypertension = models.BooleanField(default=False)
    blood_transfusion_history = models.TextField(blank=True)
    tb_history = models.TextField(blank=True)
    has_drug_allergy = models.BooleanField(default=False)
    drug_allergies_specify = models.TextField(blank=True)
    family_history_twins = models.BooleanField(default=False)
    family_history_tb = models.BooleanField(default=False)

    medical_history = models.TextField(blank=True)
    surgical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    family_history = models.TextField(blank=True)
    address = models.TextField(blank=True)
    birth_registration_number = models.CharField(max_length=50, blank=True)
    place_of_birth = models.CharField(max_length=200, blank=True)
    birth_country = models.CharField(max_length=100, blank=True)
    residence_county = models.CharField(max_length=100, blank=True)
    residence_subcounty = models.CharField(max_length=100, blank=True)
    residence_ward = models.CharField(max_length=100, blank=True)
    residence_village = models.CharField(max_length=100, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)
    emergency_contact_address = models.TextField(blank=True)
    household_size = models.PositiveIntegerField(null=True, blank=True, help_text='Number of people in household')
    registration_stage = models.CharField(max_length=20, choices=REGISTRATION_STAGE_CHOICES, default='NEW')
    profile_completed = models.BooleanField(default=False)
    profile_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    registered_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='registered_patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    national_id_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    nhif_number_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    phone_number_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['edd'],          name='patients_edd_idx'),
            models.Index(fields=['risk_level'],    name='patients_risk_idx'),
            models.Index(fields=['clinic_stage'],  name='patients_stage_idx'),
            models.Index(fields=['registration_stage'], name='patient_reg_stage_idx'),
            models.Index(fields=['is_active'],     name='patients_active_idx'),
            models.Index(fields=['national_id_hash'], name='patients_nat_hash_idx'),
            models.Index(fields=['nhif_number_hash'], name='patients_nhif_hash_idx'),
            models.Index(fields=['phone_number_hash'], name='patients_ph_hash_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.patient_number:
            self.patient_number = generate_patient_number()
        if self.lmp and not self.edd:
            self.edd = self.lmp + timedelta(days=280)

        # Calculate SHA-256 hashes for searching
        if self.national_id:
            normalized = str(self.national_id).strip()
            self.national_id_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.national_id_hash = None

        if self.nhif_number:
            normalized = str(self.nhif_number).strip()
            self.nhif_number_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.nhif_number_hash = None

        if self.phone_number:
            normalized = str(self.phone_number).strip()
            self.phone_number_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.phone_number_hash = None

        super().save(*args, **kwargs)

    @property
    def age(self):
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def active_pregnancy(self):
        return self.pregnancies.filter(status='ACTIVE').first()

    @property
    def current_lmp(self):
        active = self.active_pregnancy
        if active and active.lmp:
            return active.lmp
        return self.lmp

    @property
    def current_edd(self):
        active = self.active_pregnancy
        if active and active.edd:
            return active.edd
        return self.edd

    @property
    def weeks_pregnant(self):
        lmp_val = self.current_lmp
        if lmp_val:
            days = (date.today() - lmp_val).days
            return max(0, days // 7)
        return None

    @property
    def days_to_edd(self):
        edd_val = self.current_edd
        if edd_val:
            return (edd_val - date.today()).days
        return None

    @property
    def is_overdue(self):
        return self.days_to_edd is not None and self.days_to_edd < 0

    @property
    def is_due_soon(self):
        d = self.days_to_edd
        return d is not None and 0 <= d <= 7

    def __str__(self):
        return f"{self.patient_number} — {self.full_name}"


class Pregnancy(models.Model):
    """
    Represents an individual pregnancy episode for a patient.
    Allows tracking multiple pregnancies over time.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('DELIVERED', 'Delivered'),
        ('MISCARRIAGE', 'Miscarriage'),
        ('TERMINATED', 'Terminated'),
    ]
    RISK_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='pregnancies'
    )
    pregnancy_number = models.PositiveIntegerField(default=1, help_text="1 for 1st pregnancy, 2 for 2nd, etc.")
    gravida = models.PositiveIntegerField(null=True, blank=True, help_text="Gravidity (total pregnancies)")
    parity = models.PositiveIntegerField(null=True, blank=True, help_text="Parity (live births)")
    lmp = models.DateField(verbose_name='Last Menstrual Period')
    edd = models.DateField(verbose_name='Expected Delivery Date', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_multiple = models.BooleanField(default=False, help_text="Multiple pregnancy (twins/triplets)")
    num_fetuses = models.PositiveIntegerField(default=1)
    is_high_risk = models.BooleanField(default=False)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='LOW')
    risk_factors = models.TextField(blank=True, help_text="High risk conditions/factors")
    previous_obstetric_history = models.TextField(blank=True, help_text="Summary of previous pregnancies & outcomes")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'pregnancies'
        ordering = ['-created_at']
        verbose_name = 'Pregnancy'
        verbose_name_plural = 'Pregnancies'

    def save(self, *args, **kwargs):
        if self.lmp and not self.edd:
            self.edd = self.lmp + timedelta(days=280)
        # Automatically determine pregnancy_number if not provided
        if not self.pk and self.pregnancy_number == 1:
            count = Pregnancy.objects.filter(patient=self.patient).count()
            self.pregnancy_number = count + 1
        super().save(*args, **kwargs)

    @property
    def weeks_pregnant(self):
        if self.lmp:
            days = (date.today() - self.lmp).days
            return max(0, days // 7)
        return None

    @property
    def days_to_edd(self):
        if self.edd:
            return (self.edd - date.today()).days
        return None

    def __str__(self):
        return f"Pregnancy #{self.pregnancy_number} - {self.patient.full_name} ({self.get_status_display()})"



class PatientMedicalCondition(models.Model):
    CONDITION_STATUS_CHOICES = [
        ('KNOWN', 'Known'),
        ('ONGOING', 'Ongoing'),
        ('RESOLVED', 'Resolved'),
        ('UNKNOWN', 'Unknown'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='medical_history_entries'
    )
    condition = models.CharField(max_length=200)
    diagnosis_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=CONDITION_STATUS_CHOICES, default='KNOWN')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patient_medical_conditions'
        ordering = ['-created_at']
        verbose_name = 'Maternal Medical Condition'

    def __str__(self):
        return f"{self.condition} ({self.patient.patient_number})"


class PatientSurgicalHistory(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='surgical_history_entries'
    )
    procedure_name = models.CharField(max_length=200)
    procedure_date = models.DateField(null=True, blank=True)
    facility = models.CharField(max_length=200, blank=True)
    outcome = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patient_surgical_histories'
        ordering = ['-procedure_date', '-created_at']
        verbose_name = 'Maternal Surgical History'

    def __str__(self):
        return f"{self.procedure_name} ({self.patient.patient_number})"


class PatientAllergy(models.Model):
    ALLERGY_SEVERITY_CHOICES = [
        ('MILD', 'Mild'),
        ('MODERATE', 'Moderate'),
        ('SEVERE', 'Severe'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='allergy_entries'
    )
    allergen = models.CharField(max_length=200)
    reaction = models.CharField(max_length=200, blank=True)
    severity = models.CharField(max_length=10, choices=ALLERGY_SEVERITY_CHOICES, blank=True)
    first_noted = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patient_allergies'
        ordering = ['-created_at']
        verbose_name = 'Maternal Allergy'

    def __str__(self):
        return f"{self.allergen} ({self.patient.patient_number})"


class PatientFamilyHistory(models.Model):
    RELATION_CHOICES = [
        ('MOTHER', 'Mother'),
        ('FATHER', 'Father'),
        ('SIBLING', 'Sibling'),
        ('GRANDPARENT', 'Grandparent'),
        ('OTHER', 'Other'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='family_history_entries'
    )
    relation = models.CharField(max_length=50, choices=RELATION_CHOICES, blank=True)
    condition = models.CharField(max_length=200)
    age_at_diagnosis = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patient_family_histories'
        ordering = ['-created_at']
        verbose_name = 'Family History Entry'

    def __str__(self):
        relation_display = self.get_relation_display() if self.relation else 'Family'
        return f"{relation_display}: {self.condition} ({self.patient.patient_number})"


# ─── Partograph ────────────────────────────────────────────────────────────────

class PartographEntry(models.Model):
    """
    A single time-point observation recorded during active labour.
    Multiple entries per patient build the partograph chart over time.
    """
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='partograph_entries'
    )
    recorded_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='partograph_records'
    )

    # Time axis — hours since labour onset (0–24)
    hours_in_labour = models.DecimalField(
        max_digits=4, decimal_places=1,
        help_text='Hours elapsed since active labour onset (0–24)'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    # ── Cervimetry ──────────────────────────────────────────────────────────────
    cervical_dilation_cm = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
        help_text='Cervical dilation in cm (0–10)'
    )
    descent_station = models.IntegerField(
        null=True, blank=True,
        help_text='Station of presenting part (-5 to +5)'
    )

    # ── Fetal parameters ────────────────────────────────────────────────────────
    fetal_heart_rate = models.IntegerField(
        null=True, blank=True,
        help_text='Fetal heart rate in bpm (60–200)'
    )
    MOULDING_CHOICES = [('0', 'None'), ('1', '+'), ('2', '++'), ('3', '+++')]
    moulding = models.CharField(
        max_length=1, choices=MOULDING_CHOICES, blank=True, default='0'
    )
    LIQUOR_CHOICES = [('I', 'Intact'), ('C', 'Clear'), ('M', 'Meconium'), ('B', 'Blood'), ('A', 'Absent')]
    liquor = models.CharField(max_length=1, choices=LIQUOR_CHOICES, blank=True, default='I')

    # ── Contractions (per 10 minutes) ───────────────────────────────────────────
    contractions_per_10min = models.IntegerField(
        null=True, blank=True,
        help_text='Number of contractions per 10 minutes (0–5)'
    )
    CONTRACTION_DURATION_CHOICES = [
        ('<20', '< 20 sec'), ('20-40', '20–40 sec'), ('>40', '> 40 sec')
    ]
    contraction_duration = models.CharField(
        max_length=5, choices=CONTRACTION_DURATION_CHOICES, blank=True
    )

    # ── Maternal vitals ─────────────────────────────────────────────────────────
    bp_systolic = models.IntegerField(null=True, blank=True, help_text='Systolic BP mmHg')
    bp_diastolic = models.IntegerField(null=True, blank=True, help_text='Diastolic BP mmHg')
    pulse_rate = models.IntegerField(null=True, blank=True, help_text='Maternal pulse bpm')
    temperature_celsius = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True
    )
    urine_volume_ml = models.IntegerField(null=True, blank=True)
    URINE_PROTEIN_CHOICES = [('NIL', 'Nil'), ('TRACE', 'Trace'), ('+', '+'), ('++', '++'), ('+++', '+++')]
    urine_protein = models.CharField(max_length=5, choices=URINE_PROTEIN_CHOICES, blank=True, default='NIL')

    # ── Drugs & fluids ──────────────────────────────────────────────────────────
    oxytocin_units = models.IntegerField(null=True, blank=True, help_text='Oxytocin units/L')
    iv_fluids_ml = models.IntegerField(null=True, blank=True)
    drugs_given = models.TextField(blank=True)

    notes = models.TextField(blank=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'partograph_entries'
        ordering = ['hours_in_labour']
        verbose_name = 'Partograph Entry'

    def __str__(self):
        return f"{self.patient} — {self.hours_in_labour}h"


class SymptomReport(models.Model):
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='symptom_reports'
    )
    symptoms = models.TextField(
        blank=True,
        help_text="Comma-separated or text list of symptoms (e.g. bleeding, severe_headache, swelling, fever, reduced_fetal_movement)",
    )
    description = models.TextField(blank=True)
    severity = models.CharField(
        max_length=10, 
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')], 
        default='LOW'
    )
    reported_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20, 
        choices=[('PENDING', 'Pending'), ('REVIEWED', 'Reviewed')], 
        default='PENDING'
    )
    reviewed_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_symptoms'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'symptom_reports'
        ordering = ['-reported_at']

    def __str__(self):
        return f"SymptomReport for {self.patient.patient_number} on {self.reported_at}"


class SecureMessage(models.Model):
    class MessageType(models.TextChoices):
        GENERAL = 'GENERAL', 'General'
        CARE_ALERT = 'CARE_ALERT', 'Care Alert'

    sender = models.ForeignKey(
        'users.StaffUser', on_delete=models.CASCADE, related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        'users.StaffUser', on_delete=models.CASCADE, null=True, blank=True, related_name='received_messages'
    )
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='portal_messages'
    )
    message_type = models.CharField(
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.GENERAL,
    )
    clinical_alert = models.ForeignKey(
        'alerts.ClinicalAlert',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_up_messages',
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    parent_message = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies'
    )

    class Meta:
        db_table = 'secure_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} on {self.created_at}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Patient)
def create_mother_user_account(sender, instance, created, **kwargs):
    if created:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Generate email from first name
        first_name = instance.first_name.strip().lower() if instance.first_name else instance.full_name.split()[0].lower()
        # Clean the first name to be email-safe (remove special chars, spaces)
        first_name_clean = ''.join(c for c in first_name if c.isalnum())
        email = instance.email if instance.email else f"{first_name_clean}@gmail.com"
        
        # Generate password from national_id and last name
        national_id = str(instance.national_id).strip() if instance.national_id else ""
        last_name = instance.last_name.strip().lower() if instance.last_name else (instance.full_name.split()[-1].lower() if instance.full_name else "user")
        last_name_clean = ''.join(c for c in last_name if c.isalnum())
        password = f"{national_id}@{last_name_clean}"
        
        # Ensure password meets minimum requirements (at least 8 chars)
        if len(password) < 8:
            password = f"{password}Mat2026"

        # Prevent duplicate users if email exists
        if not User.objects.filter(email=email).exists():
            User.objects.create_user(
                email=email,
                full_name=instance.full_name,
                role='MOTHER',
                phone_number=instance.phone_number,
                password=password,
                patient=instance
            )


@receiver(post_save, sender=SecureMessage)
def broadcast_secure_message_on_save(sender, instance, created, **kwargs):
    from django.conf import settings
    if getattr(settings, 'TESTING', False):
        return
    if created:
        try:
            from supabase_services import realtime
            realtime.send_patient_message(
                sender_id=str(instance.sender_id),
                patient_id=instance.patient_id,
                message=instance.message,
                message_type=instance.message_type,
                recipient_id=str(instance.recipient_id) if instance.recipient_id else None,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Failed to broadcast secure message: %s", exc)



