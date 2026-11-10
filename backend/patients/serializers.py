from rest_framework import serializers

from .models import (
    Patient, Pregnancy, PartographEntry,
    PatientMedicalCondition, PatientSurgicalHistory,
    PatientAllergy, PatientFamilyHistory,
    SymptomReport, SecureMessage,
)


class PregnancySerializer(serializers.ModelSerializer):
    weeks_pregnant = serializers.ReadOnlyField()
    days_to_edd = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)

    class Meta:
        model = Pregnancy
        fields = [
            'id', 'patient', 'pregnancy_number', 'gravida', 'parity', 'lmp', 'edd',
            'status', 'status_display', 'is_multiple', 'num_fetuses', 'is_high_risk',
            'risk_level', 'risk_level_display', 'risk_factors', 'previous_obstetric_history',
            'notes', 'created_at', 'updated_at', 'weeks_pregnant', 'days_to_edd',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'edd']


class PatientMedicalConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientMedicalCondition
        fields = [
            'id', 'condition', 'diagnosis_date', 'status', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSurgicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientSurgicalHistory
        fields = [
            'id', 'procedure_name', 'procedure_date', 'facility', 'outcome', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientAllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAllergy
        fields = [
            'id', 'allergen', 'reaction', 'severity', 'first_noted', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientFamilyHistorySerializer(serializers.ModelSerializer):
    relation_display = serializers.CharField(source='get_relation_display', read_only=True)

    class Meta:
        model = PatientFamilyHistory
        fields = [
            'id', 'relation', 'relation_display', 'condition', 'age_at_diagnosis', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SymptomReportSerializer(serializers.ModelSerializer):
    symptoms = serializers.CharField(allow_blank=True, required=False)
    description = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = SymptomReport
        fields = [
            'id', 'patient', 'symptoms', 'description', 'severity',
            'reported_at', 'status', 'reviewed_by', 'reviewed_at', 'notes',
        ]
        read_only_fields = ['id', 'patient', 'reported_at', 'status', 'reviewed_by', 'reviewed_at']

    def validate(self, attrs):
        symptoms = (attrs.get('symptoms') or '').strip()
        description = (attrs.get('description') or '').strip()
        if not symptoms and not description:
            raise serializers.ValidationError(
                'Provide at least one symptom or a description of what you are experiencing.'
            )
        if not symptoms and description:
            attrs['symptoms'] = 'custom'
        else:
            attrs['symptoms'] = symptoms
        attrs['description'] = description
        return attrs


class SecureMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = SecureMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_role', 'recipient', 'patient',
            'message_type', 'clinical_alert', 'message', 'created_at', 'is_read', 'parent_message',
        ]
        read_only_fields = [
            'id', 'sender', 'sender_name', 'sender_role', 'patient',
            'message_type', 'clinical_alert', 'created_at',
        ]


class PatientSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    weeks_pregnant = serializers.ReadOnlyField()
    days_to_edd = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    registered_by_name = serializers.SerializerMethodField()
    active_pregnancy = PregnancySerializer(read_only=True)
    pregnancies = PregnancySerializer(many=True, read_only=True)
    medical_history_entries = PatientMedicalConditionSerializer(many=True, required=False)
    surgical_history_entries = PatientSurgicalHistorySerializer(many=True, required=False)
    allergy_entries = PatientAllergySerializer(many=True, required=False)
    family_history_entries = PatientFamilyHistorySerializer(many=True, required=False)
    symptom_reports = SymptomReportSerializer(many=True, read_only=True)
    portal_messages = SecureMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'full_name', 'first_name', 'middle_name', 'last_name', 'preferred_name',
            'gender', 'marital_status', 'education_level', 'occupation', 'spouse_name', 'spouse_phone',
            'national_id', 'nhif_number', 'rhesus_factor', 'insurance_provider',
            'phone_number', 'email', 'address', 'residence_county', 'residence_subcounty', 'residence_ward',
            'residence_village', 'birth_registration_number', 'place_of_birth', 'birth_country',
            'emergency_contact_relationship', 'emergency_contact_address', 'household_size',
            'next_of_kin_name', 'next_of_kin_phone', 'date_of_birth',
            'lmp', 'edd', 'clinic_stage', 'risk_level', 'registration_stage', 'profile_completed',
            'profile_verified', 'blood_group', 'lang',
            'active_pregnancy', 'pregnancies',
            'medical_history', 'surgical_history', 'allergies', 'family_history',
            'medical_history_entries', 'surgical_history_entries', 'allergy_entries', 'family_history_entries',
            'notes', 'is_active', 'registered_by', 'registered_by_name',
            'created_at', 'updated_at',
            # Computed
            'age', 'weeks_pregnant', 'days_to_edd', 'is_overdue', 'is_due_soon',
            # Portal related
            'symptom_reports', 'portal_messages',
        ]
        read_only_fields = ['id', 'patient_number', 'edd', 'created_at', 'updated_at']

    def get_registered_by_name(self, obj):
        if obj.registered_by:
            return obj.registered_by.full_name
        return None

    def validate_nhif_number(self, value):
        if value:
            import re
            if not re.match(r'^\d{8,12}$', value):
                raise serializers.ValidationError("NHIF/SHA/SHIF number must be between 8 and 12 digits.")
        return value

    def create(self, validated_data):
        history_data = validated_data.pop('medical_history_entries', [])
        surgical_data = validated_data.pop('surgical_history_entries', [])
        allergy_data = validated_data.pop('allergy_entries', [])
        family_data = validated_data.pop('family_history_entries', [])
        patient = Patient.objects.create(**validated_data)

        for item in history_data:
            PatientMedicalCondition.objects.create(patient=patient, **item)
        for item in surgical_data:
            PatientSurgicalHistory.objects.create(patient=patient, **item)
        for item in allergy_data:
            PatientAllergy.objects.create(patient=patient, **item)
        for item in family_data:
            PatientFamilyHistory.objects.create(patient=patient, **item)

        return patient

    def update(self, instance, validated_data):
        history_data = validated_data.pop('medical_history_entries', None)
        surgical_data = validated_data.pop('surgical_history_entries', None)
        allergy_data = validated_data.pop('allergy_entries', None)
        family_data = validated_data.pop('family_history_entries', None)

        instance = super().update(instance, validated_data)

        if history_data is not None:
            instance.medical_history_entries.all().delete()
            for item in history_data:
                PatientMedicalCondition.objects.create(patient=instance, **item)

        if surgical_data is not None:
            instance.surgical_history_entries.all().delete()
            for item in surgical_data:
                PatientSurgicalHistory.objects.create(patient=instance, **item)

        if allergy_data is not None:
            instance.allergy_entries.all().delete()
            for item in allergy_data:
                PatientAllergy.objects.create(patient=instance, **item)

        if family_data is not None:
            instance.family_history_entries.all().delete()
            for item in family_data:
                PatientFamilyHistory.objects.create(patient=instance, **item)

        return instance


class PatientListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    days_to_edd = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    weeks_pregnant = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'full_name', 'phone_number', 'email',
            'lmp', 'edd', 'clinic_stage', 'risk_level', 'registration_stage',
            'blood_group', 'lang', 'residence_county', 'residence_village', 'is_active',
            'days_to_edd', 'is_due_soon', 'is_overdue', 'weeks_pregnant',
        ]


class PartographEntrySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PartographEntry
        fields = [
            'id', 'patient', 'recorded_by', 'recorded_by_name',
            'hours_in_labour', 'recorded_at',
            # Cervimetry
            'cervical_dilation_cm', 'descent_station',
            # Fetal
            'fetal_heart_rate', 'moulding', 'liquor',
            # Contractions
            'contractions_per_10min', 'contraction_duration',
            # Maternal vitals
            'bp_systolic', 'bp_diastolic', 'pulse_rate',
            'temperature_celsius', 'urine_volume_ml', 'urine_protein',
            # Drugs
            'oxytocin_units', 'iv_fluids_ml', 'drugs_given',
            'notes',
        ]
        read_only_fields = ['id', 'patient', 'recorded_by', 'recorded_at', 'recorded_by_name']

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.full_name
        return None



