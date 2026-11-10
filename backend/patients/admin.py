from django.contrib import admin
from .models import (
    Patient, PatientMedicalCondition, PatientSurgicalHistory,
    PatientAllergy, PatientFamilyHistory,
)


class PatientMedicalConditionInline(admin.TabularInline):
    model = PatientMedicalCondition
    extra = 0
    classes = ['collapse']


class PatientSurgicalHistoryInline(admin.TabularInline):
    model = PatientSurgicalHistory
    extra = 0
    classes = ['collapse']


class PatientAllergyInline(admin.TabularInline):
    model = PatientAllergy
    extra = 0
    classes = ['collapse']


class PatientFamilyHistoryInline(admin.TabularInline):
    model = PatientFamilyHistory
    extra = 0
    classes = ['collapse']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = [
        'patient_number', 'full_name', 'phone_number', 'lmp', 'edd',
        'clinic_stage', 'risk_level', 'registration_stage', 'profile_completed', 'is_active'
    ]
    list_filter = ['clinic_stage', 'risk_level', 'registration_stage', 'is_active']
    search_fields = [
        'patient_number', 'full_name', 'phone_number', 'national_id',
        'residence_county', 'residence_village'
    ]
    ordering = ['-created_at']
    readonly_fields = ['patient_number', 'edd', 'created_at', 'updated_at']
    inlines = [
        PatientMedicalConditionInline,
        PatientSurgicalHistoryInline,
        PatientAllergyInline,
        PatientFamilyHistoryInline,
    ]
    fieldsets = (
        ('Patient Identity', {
            'fields': (
                'patient_number', 'full_name', 'first_name', 'middle_name', 'last_name',
                'preferred_name', 'national_id', 'nhif_number', 'date_of_birth',
                'gender', 'marital_status', 'education_level', 'occupation',
                'spouse_name', 'spouse_phone', 'birth_registration_number',
                'place_of_birth', 'birth_country',
            )
        }),
        ('Contact & Residence', {
            'fields': (
                'phone_number', 'address', 'residence_county', 'residence_subcounty',
                'residence_ward', 'residence_village', 'emergency_contact_relationship',
                'emergency_contact_address', 'next_of_kin_name', 'next_of_kin_phone',
                'household_size',
            )
        }),
        ('Maternal Profile', {
            'fields': (
                'lmp', 'edd', 'clinic_stage', 'risk_level', 'registration_stage',
                'profile_completed', 'profile_verified', 'blood_group', 'lang',
                'medical_history', 'surgical_history', 'allergies', 'family_history',
                'notes',
            )
        }),
        ('System', {
            'fields': ('is_active', 'registered_by', 'created_at', 'updated_at')
        }),
    )
