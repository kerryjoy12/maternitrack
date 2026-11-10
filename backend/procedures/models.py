from django.db import models


class ClinicalProcedure(models.Model):
    """
    A categorized maternity procedure or clinical protocol.
    Admin/Doctor editable with version tracking.
    """
    CATEGORY_CHOICES = [
        ('NORMAL_DELIVERY', 'Normal Vaginal Delivery'),
        ('ASSISTED_DELIVERY', 'Assisted Delivery'),
        ('CAESAREAN', 'Caesarean Section Support'),
        ('BREECH', 'Breech Delivery'),
        ('MULTIPLE_DELIVERY', 'Twin/Multiple Delivery'),
        ('ANC_PROCEDURE', 'Antenatal Procedure'),
        ('POSTNATAL_CARE', 'Postnatal Care'),
        ('NEWBORN_CARE', 'Newborn Care'),
        ('INFECTION_PREVENTION', 'Infection Prevention'),
    ]
    SEVERITY_CHOICES = [
        ('ROUTINE', 'Routine'),
        ('URGENT', 'Urgent'),
        ('EMERGENCY', 'Emergency'),
    ]

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    summary = models.TextField(help_text='Brief clinical summary')
    severity = models.CharField(max_length=15, choices=SEVERITY_CHOICES, default='ROUTINE')
    icon = models.CharField(max_length=10, default='📋')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    version = models.CharField(max_length=20, default='1.0')

    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_procedures'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_procedures'
        ordering = ['category', 'sort_order']

    def __str__(self):
        return f"[{self.category}] {self.title}"


class ProcedureStep(models.Model):
    """Individual step within a procedure."""
    procedure = models.ForeignKey(
        ClinicalProcedure, on_delete=models.CASCADE, related_name='steps'
    )
    step_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    warning_note = models.TextField(
        blank=True, help_text='Critical safety warning for this step'
    )
    estimated_duration_min = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'procedure_steps'
        ordering = ['step_number']
        unique_together = [('procedure', 'step_number')]

    def __str__(self):
        return f"Step {self.step_number}: {self.title}"


class EmergencyProtocol(models.Model):
    """
    Emergency obstetric management protocol.
    Contains response algorithms, danger signs, and escalation steps.
    """
    EMERGENCY_CHOICES = [
        ('PPH', 'Postpartum Hemorrhage'),
        ('ECLAMPSIA', 'Eclampsia / Pre-eclampsia'),
        ('OBSTRUCTED_LABOUR', 'Obstructed Labour'),
        ('NEONATAL_RESUS', 'Neonatal Resuscitation'),
        ('SEPSIS', 'Sepsis Management'),
        ('CORD_PROLAPSE', 'Cord Prolapse'),
        ('SHOULDER_DYSTOCIA', 'Shoulder Dystocia'),
        ('AMNIOTIC_EMBOLISM', 'Amniotic Fluid Embolism'),
    ]

    emergency_type = models.CharField(max_length=30, choices=EMERGENCY_CHOICES, unique=True)
    title = models.CharField(max_length=200)
    icon = models.CharField(max_length=10, default='🚨')
    danger_signs = models.TextField(help_text='Key warning signs to recognize')
    immediate_response = models.TextField(help_text='Step-by-step immediate action algorithm')
    escalation_steps = models.TextField(help_text='When and how to escalate')
    monitoring_requirements = models.TextField(blank=True)
    referral_criteria = models.TextField(blank=True)
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergency_protocols'
        ordering = ['emergency_type']

    def __str__(self):
        return f"🚨 {self.title}"


class EmergencyDrug(models.Model):
    """Drug reference for emergency protocols."""
    ROUTE_CHOICES = [
        ('IV', 'Intravenous'),
        ('IM', 'Intramuscular'),
        ('IV/IM', 'Intravenous/Intramuscular'),
        ('ORAL', 'Oral'),
        ('SUBLINGUAL', 'Sublingual'),
        ('RECTAL', 'Rectal'),
        ('Sublingual/Rectal', 'Sublingual/Rectal'),
        ('TOPICAL', 'Topical'),
        ('SC', 'Subcutaneous'),
        ('IV/Endotracheal', 'Intravenous/Endotracheal'),
    ]

    protocol = models.ForeignKey(
        EmergencyProtocol, on_delete=models.CASCADE, related_name='drugs'
    )
    drug_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=200)
    route = models.CharField(max_length=50, choices=ROUTE_CHOICES)
    frequency = models.CharField(max_length=100)
    max_dose = models.CharField(max_length=100, blank=True)
    contraindications = models.TextField(blank=True)
    important_notes = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'emergency_drugs'
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.drug_name} ({self.dosage}) — {self.route}"


class ProcedureEquipment(models.Model):
    """Equipment needed for procedures and emergencies."""
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)
    category = models.CharField(max_length=50, blank=True)
    procedures = models.ManyToManyField(ClinicalProcedure, blank=True, related_name='equipment')
    protocols = models.ManyToManyField(EmergencyProtocol, blank=True, related_name='equipment')

    class Meta:
        db_table = 'procedure_equipment'
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class ClinicalChecklist(models.Model):
    """Reusable clinical checklist template."""
    title = models.CharField(max_length=200)
    procedure = models.ForeignKey(
        ClinicalProcedure, on_delete=models.CASCADE,
        null=True, blank=True, related_name='checklists'
    )
    protocol = models.ForeignKey(
        EmergencyProtocol, on_delete=models.CASCADE,
        null=True, blank=True, related_name='checklists'
    )
    items = models.JSONField(
        default=list,
        help_text='Array of checklist items: [{"text": "...", "critical": true/false}]'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'clinical_checklists'

    def __str__(self):
        return self.title


class ProtocolAccessLog(models.Model):
    """Audit log for emergency protocol access during emergencies."""
    protocol = models.ForeignKey(
        EmergencyProtocol, on_delete=models.CASCADE, related_name='access_logs'
    )
    accessed_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True
    )
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.SET_NULL, null=True, blank=True,
        help_text='Patient context when protocol was accessed'
    )
    accessed_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = 'protocol_access_logs'
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.accessed_by} accessed {self.protocol} at {self.accessed_at}"
