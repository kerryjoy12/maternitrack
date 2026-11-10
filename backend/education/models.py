from django.db import models
from django.conf import settings

class EducationCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📚')

    class Meta:
        verbose_name_plural = "Education Categories"

    def __str__(self):
        return self.name

class EducationResource(models.Model):
    AUDIENCE_CHOICES = [
        ('DOCTOR', 'Doctors'),
        ('NURSE', 'Nurses'),
        ('PATIENT', 'Patients (Mothers)'),
        ('PARTNER', 'Partners'),
        ('ADOLESCENT', 'Adolescents'),
        ('ADMIN', 'Administrators'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(EducationCategory, on_delete=models.CASCADE, related_name='resources')
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES)
    summary = models.TextField(help_text="Short summary for the list view")
    content = models.TextField(help_text="Full educational content (HTML/Markdown supported)")
    
    # Links to existing clinical data
    related_protocols = models.ManyToManyField('procedures.EmergencyProtocol', blank=True)
    related_procedures = models.ManyToManyField('procedures.ClinicalProcedure', blank=True)
    
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.audience}] {self.title}"
