from django.db import models


class NutritionCategory(models.Model):
    """Categories: Iron-rich, Protein, Calcium, Folic Acid, Hydration, etc."""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=10, default='🥗')
    description = models.TextField(blank=True)
    color_hex = models.CharField(max_length=7, default='#2DD4BF')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'nutrition_categories'
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Nutrition Categories'

    def __str__(self):
        return self.name


class PatientNutritionProfile(models.Model):
    """
    Per-patient nutrition profile computed from clinical data.
    Auto-generated and updated when patient records change.
    """
    PHASE_CHOICES = [
        ('ANC_T1', 'Antenatal — Trimester 1'),
        ('ANC_T2', 'Antenatal — Trimester 2'),
        ('ANC_T3', 'Antenatal — Trimester 3'),
        ('POSTNATAL_EARLY', 'Postnatal — Early (0–6 weeks)'),
        ('POSTNATAL_LATE', 'Postnatal — Late (6+ weeks)'),
        ('LACTATING', 'Lactating'),
    ]

    patient = models.OneToOneField(
        'patients.Patient', on_delete=models.CASCADE, related_name='nutrition_profile'
    )
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default='ANC_T1')
    is_anaemic = models.BooleanField(default=False)
    is_hypertensive = models.BooleanField(default=False)
    is_diabetic = models.BooleanField(default=False)
    is_lactating = models.BooleanField(default=False)
    is_post_caesarean = models.BooleanField(default=False)
    bmi = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    current_weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    target_weight_gain_kg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    calorie_target = models.PositiveIntegerField(default=2200)
    allergies = models.TextField(blank=True, help_text='Comma-separated allergens')
    dietary_preferences = models.TextField(blank=True, help_text='e.g. vegetarian, halal')
    notes = models.TextField(blank=True)

    updated_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_nutrition_profiles'

    def __str__(self):
        return f"Nutrition: {self.patient.full_name} ({self.phase})"


class DietPlan(models.Model):
    """
    A weekly meal plan template for a specific phase/condition combination.
    Can be system-generated or doctor-customized.
    """
    MEAL_CHOICES = [
        ('BREAKFAST', 'Breakfast'),
        ('MORNING_SNACK', 'Morning Snack'),
        ('LUNCH', 'Lunch'),
        ('AFTERNOON_SNACK', 'Afternoon Snack'),
        ('DINNER', 'Dinner'),
        ('EVENING_SNACK', 'Evening Snack'),
    ]
    DAY_CHOICES = [(i, f'Day {i}') for i in range(1, 8)]

    title = models.CharField(max_length=200)
    phase = models.CharField(max_length=20, choices=PatientNutritionProfile.PHASE_CHOICES)
    condition_tags = models.CharField(
        max_length=200, blank=True,
        help_text='Comma-separated: anaemia, hypertension, diabetes, caesarean'
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    day_of_week = models.PositiveIntegerField(choices=DAY_CHOICES, default=1)
    description = models.TextField(help_text='Full meal description with portions')
    foods = models.TextField(help_text='Comma-separated food items')
    calories_approx = models.PositiveIntegerField(default=0)
    categories = models.ManyToManyField(NutritionCategory, blank=True)
    local_alternatives = models.TextField(
        blank=True,
        help_text='Locally available alternatives for rural settings'
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'diet_plans'
        ordering = ['day_of_week', 'meal_type']

    def __str__(self):
        return f"[{self.phase}] {self.get_meal_type_display()} Day {self.day_of_week} — {self.title}"


class DietRecommendation(models.Model):
    """
    A personalized recommendation instance linking a patient to a diet plan.
    Tracks adherence and doctor overrides.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('OVERRIDDEN', 'Overridden by Doctor'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='diet_recommendations'
    )
    diet_plan = models.ForeignKey(DietPlan, on_delete=models.CASCADE, related_name='recommendations')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    adherence_score = models.PositiveIntegerField(
        default=0, help_text='0-100 adherence percentage'
    )
    override_notes = models.TextField(blank=True)
    overridden_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'diet_recommendations'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.full_name} — {self.diet_plan.title}"


class WeightLog(models.Model):
    """Track maternal weight throughout pregnancy and postpartum."""
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='weight_logs'
    )
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    gestational_week = models.PositiveIntegerField(null=True, blank=True)
    notes = models.CharField(max_length=200, blank=True)
    recorded_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'weight_logs'
        ordering = ['recorded_at']

    def __str__(self):
        return f"{self.patient.full_name} — {self.weight_kg}kg (wk {self.gestational_week})"
