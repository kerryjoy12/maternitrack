from rest_framework import serializers
from .models import Referral, KMHFLFacility

class KMHFLFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = KMHFLFacility
        fields = ['id', 'code', 'name', 'county']


class ReferralSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    referred_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            'id', 'patient', 'patient_name', 'patient_number',
            'referred_by', 'referred_by_name',
            'referral_date', 'destination_facility', 'reason', 'urgency',
            'clinical_summary', 'transport_mode', 'feedback_received',
            'outcome_notes', 'status', 'created_at', 'updated_at',
            
            # Kisii County fields
            'serial_no', 'referring_facility_name', 'referring_facility_mfl',
            'referring_facility_contacts', 'receiving_facility_mfl',
            'receiving_facility_contacts', 'referral_time', 'admission_date',
            'admission_time', 'patient_age', 'patient_gender', 'patient_ip_op_no',
            'patient_diagnosis', 'next_of_kin_contacts', 'history_illness_injury',
            'medical_surgical_history', 'allergies', 'anc_visits_count',
            'anc_facility', 'tt_dose', 'para', 'gravida', 'hiv_status',
            'syphilis_status', 'hb_level', 'blood_group', 'rhesus_factor',
            'fundal_height', 'fetal_lie', 'fetal_presentation', 'fetal_position',
            'cervical_dilatation', 'presenting_part', 'membranes_status',
            'fetal_heart_rate', 'spo2', 'pulse_rate', 'respiratory_rate',
            'blood_pressure', 'temperature', 'investigations_done',
            'treatment_interventions', 'ambulance_first_call_time',
            'ambulance_call_received_time', 'ambulance_dispatched_time',
            'ambulance_arrival_scene_time', 'ambulance_departure_facility_time',
            'ambulance_arrival_hospital_time', 'gcs_eye', 'gcs_motor',
            'gcs_verbal', 'gcs_score_total', 'crew_1_name', 'crew_1_sign',
            'crew_2_name', 'crew_2_sign', 'ambulance_reg_no', 'receiving_hospital',
            'staff_handed_over', 'handover_date', 'handover_time', 'call_made_by',
            'call_made_by_designation', 'call_made_by_time', 'call_received_by',
            'call_received_by_designation', 'call_received_by_time', 'comments'
        ]
        read_only_fields = ['id', 'referred_by', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number

    def get_referred_by_name(self, obj):
        return obj.referred_by.full_name if obj.referred_by else None
