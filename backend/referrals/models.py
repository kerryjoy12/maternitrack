from django.db import models
from django.conf import settings
from patients.models import Patient

class KMHFLFacility(models.Model):
    code = models.CharField(max_length=50, unique=True, help_text="KMHFL code of the facility")
    name = models.CharField(max_length=255, help_text="Official name of the facility")
    county = models.CharField(max_length=100, blank=True, help_text="County where facility is located")

    class Meta:
        db_table = 'referral_kmhfl_facilities'
        verbose_name = "KMHFL Facility"
        verbose_name_plural = "KMHFL Facilities"
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


class Referral(models.Model):
    URGENCY_CHOICES = [
        ('ROUTINE', 'Routine'),
        ('URGENT', 'Urgent'),
        ('EMERGENCY', 'Emergency'),
    ]

    TRANSPORT_CHOICES = [
        ('AMBULANCE', 'Ambulance'),
        ('PRIVATE', 'Private Transport'),
        ('PUBLIC', 'Public Transport'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('COMPLETED', 'Completed'),
        ('DECLINED', 'Declined'),
    ]

    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='referrals',
        help_text="Patient being referred"
    )
    referred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_referrals',
        help_text="Staff user making the referral"
    )
    referral_date = models.DateField(help_text="Date of the referral")
    destination_facility = models.CharField(
        max_length=255, 
        help_text="KMHFL code + name of destination facility"
    )
    reason = models.TextField(help_text="Reason for referral")
    urgency = models.CharField(
        max_length=20, 
        choices=URGENCY_CHOICES, 
        default='ROUTINE'
    )
    clinical_summary = models.TextField(help_text="Clinical summary of the patient")
    transport_mode = models.CharField(
        max_length=20, 
        choices=TRANSPORT_CHOICES, 
        default='PUBLIC'
    )
    feedback_received = models.BooleanField(
        default=False, 
        help_text="Has feedback been received from destination facility?"
    )
    outcome_notes = models.TextField(
        blank=True, 
        help_text="Outcome or feedback notes"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING'
    )
    
    # --- Kisii County Adult Referral Form Fields ---
    serial_no = models.CharField(max_length=50, null=True, blank=True, help_text="Form Serial Number")
    referring_facility_name = models.CharField(max_length=255, null=True, blank=True)
    referring_facility_mfl = models.CharField(max_length=50, null=True, blank=True)
    referring_facility_contacts = models.CharField(max_length=100, null=True, blank=True)
    receiving_facility_mfl = models.CharField(max_length=50, null=True, blank=True)
    receiving_facility_contacts = models.CharField(max_length=100, null=True, blank=True)
    referral_time = models.TimeField(null=True, blank=True)
    admission_date = models.DateField(null=True, blank=True)
    admission_time = models.TimeField(null=True, blank=True)

    # Patient Snapshot
    patient_age = models.IntegerField(null=True, blank=True)
    patient_gender = models.CharField(max_length=10, null=True, blank=True)
    patient_ip_op_no = models.CharField(max_length=50, null=True, blank=True)
    patient_diagnosis = models.TextField(null=True, blank=True)
    next_of_kin_contacts = models.CharField(max_length=100, null=True, blank=True)

    # Clinical History
    history_illness_injury = models.TextField(null=True, blank=True)
    medical_surgical_history = models.TextField(null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)

    # OBS/GYN History
    anc_visits_count = models.IntegerField(null=True, blank=True)
    anc_facility = models.CharField(max_length=255, null=True, blank=True)
    tt_dose = models.CharField(max_length=20, null=True, blank=True)
    para = models.IntegerField(null=True, blank=True)
    gravida = models.IntegerField(null=True, blank=True)
    hiv_status = models.CharField(max_length=50, null=True, blank=True)
    syphilis_status = models.CharField(max_length=50, null=True, blank=True)
    hb_level = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    blood_group = models.CharField(max_length=10, null=True, blank=True)
    rhesus_factor = models.CharField(max_length=10, null=True, blank=True)
    fundal_height = models.IntegerField(null=True, blank=True)
    fetal_lie = models.CharField(max_length=50, null=True, blank=True)
    fetal_presentation = models.CharField(max_length=50, null=True, blank=True)
    fetal_position = models.CharField(max_length=50, null=True, blank=True)
    cervical_dilatation = models.CharField(max_length=50, null=True, blank=True)
    presenting_part = models.CharField(max_length=100, null=True, blank=True)
    membranes_status = models.CharField(max_length=100, null=True, blank=True)

    # Observations
    fetal_heart_rate = models.IntegerField(null=True, blank=True)
    spo2 = models.IntegerField(null=True, blank=True)
    pulse_rate = models.IntegerField(null=True, blank=True)
    respiratory_rate = models.IntegerField(null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    # Assessments & Interventions
    investigations_done = models.TextField(null=True, blank=True)
    treatment_interventions = models.TextField(null=True, blank=True)

    # Ambulance Dispatch Logs
    ambulance_first_call_time = models.TimeField(null=True, blank=True)
    ambulance_call_received_time = models.TimeField(null=True, blank=True)
    ambulance_dispatched_time = models.TimeField(null=True, blank=True)
    ambulance_arrival_scene_time = models.TimeField(null=True, blank=True)
    ambulance_departure_facility_time = models.TimeField(null=True, blank=True)
    ambulance_arrival_hospital_time = models.TimeField(null=True, blank=True)

    # Glasgow Coma Scale
    gcs_eye = models.IntegerField(null=True, blank=True)
    gcs_motor = models.IntegerField(null=True, blank=True)
    gcs_verbal = models.IntegerField(null=True, blank=True)
    gcs_score_total = models.IntegerField(null=True, blank=True)

    # Ambulance & Personnel details
    crew_1_name = models.CharField(max_length=255, null=True, blank=True)
    crew_1_sign = models.CharField(max_length=100, null=True, blank=True)
    crew_2_name = models.CharField(max_length=255, null=True, blank=True)
    crew_2_sign = models.CharField(max_length=100, null=True, blank=True)
    ambulance_reg_no = models.CharField(max_length=50, null=True, blank=True)
    receiving_hospital = models.CharField(max_length=255, null=True, blank=True)
    staff_handed_over = models.CharField(max_length=255, null=True, blank=True)
    handover_date = models.DateField(null=True, blank=True)
    handover_time = models.TimeField(null=True, blank=True)

    # Call details
    call_made_by = models.CharField(max_length=255, null=True, blank=True)
    call_made_by_designation = models.CharField(max_length=100, null=True, blank=True)
    call_made_by_time = models.TimeField(null=True, blank=True)
    call_received_by = models.CharField(max_length=255, null=True, blank=True)
    call_received_by_designation = models.CharField(max_length=100, null=True, blank=True)
    call_received_by_time = models.TimeField(null=True, blank=True)

    # Comments
    comments = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'referrals'
        ordering = ['-referral_date', '-created_at']

    def __str__(self):
        return f"Referral of {self.patient.full_name} to {self.destination_facility} — {self.status}"
