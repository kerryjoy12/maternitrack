from django.db import models
from datetime import date

class ChildProfile(models.Model):
    mother = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='children')
    postnatal_record = models.OneToOneField(
        'postnatal.PostnatalRecord', on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='child_profile',
        help_text="Link to the delivery record that spawned this child"
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(
        max_length=10, 
        choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('UNKNOWN', 'Unknown')], 
        default='UNKNOWN'
    )
    date_of_birth = models.DateField()
    birth_weight_kg = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    birth_certificate_number = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pediatrics_child_profile'
        ordering = ['-date_of_birth']

    def __str__(self):
        return f"Child of {self.mother.full_name} ({self.date_of_birth})"

class GrowthRecord(models.Model):
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='growth_records')
    date_recorded = models.DateField(default=date.today)
    weight_kg = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    head_circumference_cm = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Notes on nutrition, under-weight patterns, etc.")

    class Meta:
        db_table = 'pediatrics_growth_record'
        ordering = ['-date_recorded']

    def __str__(self):
        return f"Growth Record for {self.child} on {self.date_recorded}"

class VaccinationRecord(models.Model):
    VACCINE_CHOICES = [
        ('BCG', 'BCG'),
        ('OPV0', 'OPV 0'),
        ('OPV1', 'OPV 1'),
        ('OPV2', 'OPV 2'),
        ('OPV3', 'OPV 3'),
        ('PENTA1', 'Pentavalent 1'),
        ('PENTA2', 'Pentavalent 2'),
        ('PENTA3', 'Pentavalent 3'),
        ('PCV1', 'PCV 1'),
        ('PCV2', 'PCV 2'),
        ('PCV3', 'PCV 3'),
        ('ROTA1', 'Rotavirus 1'),
        ('ROTA2', 'Rotavirus 2'),
        ('IPV', 'IPV'),
        ('MEASLES_RUBELLA', 'Measles-Rubella (9 months)'),
        ('MEASLES2', 'Measles 2 (18 months)'),
        ('VITAMIN_A', 'Vitamin A'),
        ('OTHER', 'Other')
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('GIVEN', 'Given'),
        ('MISSED', 'Missed')
    ]
    
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='vaccinations')
    vaccine_name = models.CharField(max_length=20, choices=VACCINE_CHOICES)
    expected_date = models.DateField(null=True, blank=True)
    given_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    administered_by = models.ForeignKey('users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'pediatrics_vaccination_record'
        ordering = ['expected_date']

    def __str__(self):
        return f"{self.get_vaccine_name_display()} for {self.child} - {self.status}"

class ChildClinicVisit(models.Model):
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='clinic_visits')
    visit_date = models.DateField(default=date.today)
    fever_illness_history = models.TextField(blank=True, help_text="History of fever or illnesses since last visit")
    nutrition_status = models.TextField(blank=True, help_text="Breastfeeding, weaning, general nutrition")
    development_milestones = models.TextField(blank=True, help_text="Milestones achieved (e.g. sitting, crawling)")
    doctor_recommendations = models.TextField(blank=True)
    next_visit_date = models.DateField(null=True, blank=True)
    
    attending_staff = models.ForeignKey('users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'pediatrics_clinic_visit'
        ordering = ['-visit_date']

    def __str__(self):
        return f"Clinic Visit for {self.child} on {self.visit_date}"
