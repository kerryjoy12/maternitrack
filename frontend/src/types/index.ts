// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'NURSE' | 'DOCTOR' | 'MOTHER';
  phone_number: string;
  bio: string;
  profile_completed: boolean;
  has_pmtct_permission?: boolean;
  date_joined: string;
  patient_id?: number | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}


// ─── Patient ──────────────────────────────────────────────────────────────────
export type ClinicStage = 'ANC1' | 'ANC2' | 'ANC3' | 'ANC4' | 'DELIVERED' | 'POSTNATAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Patient {
  id: number;
  patient_number: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  national_id: string | null;
  nhif_number: string | null;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  date_of_birth: string | null;
  lmp: string | null;
  edd: string | null;
  clinic_stage: ClinicStage;
  risk_level: RiskLevel;
  blood_group: string;
  rhesus_factor?: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';
  insurance_provider?: string;
  lang: 'en' | 'sw';
  gender: string;
  marital_status: string;
  education_level: string;
  occupation: string;
  spouse_name: string;
  spouse_phone: string;
  medical_history: string;
  surgical_history: string;
  allergies: string;
  family_history: string;
  address: string;
  residence_county: string;
  residence_subcounty: string;
  residence_ward: string;
  residence_village: string;
  emergency_contact_relationship: string;
  emergency_contact_address: string;
  health_facility_name: string;
  kmhfl_code: string;
  anc_number: string;
  pnc_number: string;
  gravida: number | null;
  parity: number | null;
  height: number | null;
  weight: number | null;
  estate_house_number: string;
  has_diabetes: boolean;
  has_hypertension: boolean;
  blood_transfusion_history: string;
  tb_history: string;
  has_drug_allergy: boolean;
  drug_allergies_specify: string;
  family_history_twins: boolean;
  family_history_tb: boolean;
  notes: string;
  is_active: boolean;
  registered_by: number | null;
  registered_by_name: string | null;
  created_at: string;
  updated_at: string;
  active_pregnancy?: Pregnancy | null;
  pregnancies?: Pregnancy[];
  // Computed
  age: number | null;
  weeks_pregnant: number | null;
  days_to_edd: number | null;
  is_overdue: boolean;
  is_due_soon: boolean;
}

export interface Pregnancy {
  id: number;
  patient: number;
  pregnancy_number: number;
  gravida: number | null;
  parity: number | null;
  lmp: string;
  edd: string | null;
  status: 'ACTIVE' | 'DELIVERED' | 'MISCARRIAGE' | 'TERMINATED';
  status_display?: string;
  is_multiple: boolean;
  num_fetuses: number;
  is_high_risk: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_level_display?: string;
  risk_factors: string;
  previous_obstetric_history: string;
  notes: string;
  created_at: string;
  updated_at: string;
  weeks_pregnant: number | null;
  days_to_edd: number | null;
}

export type ANCVisitStatus = 'DRAFT' | 'COMPLETED';

export interface ANCVisit {
  id: number;
  patient: number;
  patient_name?: string;
  patient_number?: string;
  pregnancy: number | null;
  visit_number: number;
  visit_date: string;
  gestational_age_weeks: number | null;
  department: string;
  visit_status: ANCVisitStatus;
  
  // Tab 1: Vitals
  weight_kg: string | number | null;
  height_cm: string | number | null;
  bmi: string | number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_rate: number | null;
  respiratory_rate: number | null;
  temperature_c: string | number | null;
  oxygen_saturation: number | null;
  muac_cm: string | number | null;
  
  // Tab 2: Maternal & Fetal Assessment
  presenting_complaints: string;
  general_examination: string;
  oedema: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  pallor: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  fundal_height_cm: number | null;
  fetal_heart_rate: number | null;
  fetal_presentation: 'CEPHALIC' | 'BREECH' | 'TRANSVERSE' | '';
  fetal_movement: 'NORMAL' | 'DECREASED' | 'ABSENT' | 'NOT_APPLICABLE';
  
  // Tab 3: Laboratory Investigations
  blood_group_confirmed: string;
  rhesus_factor: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';
  hemoglobin_gdl: string | number | null;
  anemia_severity: string;
  blood_sugar_mgdl: string | number | null;
  blood_sugar_type: string;
  urine_protein: 'NIL' | 'TRACE' | '+' | '++' | '+++';
  urine_glucose: 'NIL' | 'TRACE' | '+' | '++' | '+++';
  urine_ketones: 'NIL' | 'TRACE' | '+' | '++' | '+++';
  urine_leukocytes: 'NIL' | 'TRACE' | '+' | '++' | '+++';
  urine_nitrites: 'NEGATIVE' | 'POSITIVE';
  tb_screening_outcome: 'NEGATIVE' | 'POSITIVE' | 'NOT_TESTED';
  ipt_date_given: string | null;
  ipt_next_visit: string | null;
  hiv_status: 'NON-REACTIVE' | 'REACTIVE' | 'INCONCLUSIVE' | 'NOT_TESTED';
  hiv_retest_date: string | null;
  syphilis_status: 'NON-REACTIVE' | 'REACTIVE' | 'INCONCLUSIVE' | 'NOT_TESTED';
  hepatitis_b_surface_ag: 'NON-REACTIVE' | 'REACTIVE' | 'INCONCLUSIVE' | 'NOT_TESTED';
  rubella_igg: string;
  couple_hiv_testing_done: boolean;
  partner_hiv_status: 'NON-REACTIVE' | 'REACTIVE' | 'INCONCLUSIVE' | 'NOT_TESTED';
  
  // Tab 4: Obstetric Ultrasound
  ultrasound_done: boolean;
  scan_date: string | null;
  ultrasound_gestational_age: number | null;
  placenta_location: string;
  fetal_position: string;
  estimated_fetal_weight_g: number | null;
  amniotic_fluid: 'NORMAL' | 'OLIGOHYDRAMNIOS' | 'POLYHYDRAMNIOS' | '';
  num_fetuses_seen: number;
  ultrasound_results: string;
  
  // Tab 5: Clinical Notes
  consultation_notes: string;
  assessment: string;
  diagnosis: string;
  treatment_plan: string;
  complications_noted: string;
  general_notes: string;
  remarks: string;
  
  // Tab 6: Prescriptions & Medications
  medication_prescribed: string;
  supplements_given: string;
  health_education_given: string;
  
  // Tab 7: Referrals
  referral_facility: string;
  referral_reason: string;
  referral_date: string | null;
  referral_status: 'NONE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  
  // Tab 8: Next Appointment & Reminders
  next_appointment_date: string | null;
  reminder_status: 'PENDING' | 'SENT' | 'DISABLED';
  send_sms_reminder: boolean;
  send_email_reminder: boolean;
  
  attending_staff_name?: string;
  created_at: string;
  updated_at: string;
  lab_results_summary?: string;
}

export type PatientForm = Omit<Patient,
  'id' | 'patient_number' | 'edd' | 'created_at' | 'updated_at' |
  'registered_by_name' | 'age' | 'weeks_pregnant' | 'days_to_edd' | 'is_overdue' | 'is_due_soon' |
  'active_pregnancy' | 'pregnancies'
>;

// ─── Appointment ──────────────────────────────────────────────────────────────
export type AppointmentType = 'ANC1' | 'ANC2' | 'ANC3' | 'ANC4' | 'POSTNATAL_7DAY' | 'POSTNATAL_6WEEK' | 'OTHER';
export type AppointmentStatus = 'UPCOMING' | 'ATTENDED' | 'MISSED' | 'RESCHEDULED' | 'CANCELLED';

export interface Appointment {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  patient_phone: string;
  appointment_type: AppointmentType;
  scheduled_date: string;
  scheduled_time: string | null;
  attended_date: string | null;
  status: AppointmentStatus;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: number;
  ticket: number;
  author: number;
  author_name: string;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_by: number;
  created_by_name: string;
  created_by_role: 'ADMIN' | 'NURSE' | 'DOCTOR';
  patient: number | null;
  patient_name: string | null;
  patient_number: string | null;
  created_at: string;
  updated_at: string;
  reply?: TicketReply | null;
}

export interface Notification {
  id: number;
  user: number;
  user_email: string;
  ticket: number | null;
  ticket_title: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Postnatal ────────────────────────────────────────────────────────────────
export interface PostnatalRecord {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  delivery_date: string;
  delivery_type: 'NORMAL' | 'CAESAREAN' | 'ASSISTED';
  baby_first_name: string;
  baby_last_name: string;
  baby_weight_kg: string | null;
  baby_gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  mother_condition: string;
  baby_condition: string;
  review_7day_date: string | null;
  review_7day_attended: boolean;
  review_7day_notes: string;
  review_6week_date: string | null;
  review_6week_attended: boolean;
  review_6week_notes: string;
  bcg_given: boolean;
  opv0_given: boolean;
  hep_b_given: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  review_7day_overdue: boolean;
  review_6week_overdue: boolean;
}

// ─── Reminder ─────────────────────────────────────────────────────────────────
export interface ReminderLog {
  id: number;
  patient: number;
  patient_name: string;
  appointment: number | null;
  appointment_info: string | null;
  phone_number: string;
  message_body: string;
  sent_at: string;
  delivery_status: 'PENDING' | 'SENT' | 'FAILED';
  provider: string;
  error_message: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  total_patients: number;
  due_this_week: number;
  overdue_delivery: number;
  missed_appointments: number;
  upcoming_this_week: number;
  postnatal_pending_7day: number;
  postnatal_pending_6week: number;
  high_risk_patients: number;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
  appointment_breakdown: {
    upcoming: number;
    attended: number;
    missed: number;
    rescheduled: number;
  };
  stage_breakdown: Record<string, number>;
}

// ─── API Pagination ───────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Clinical Alerts ──────────────────────────────────────────────────────────
export type AlertType =
  | 'FHR_LOW' | 'FHR_HIGH' | 'BP_CRITICAL'
  | 'ACTION_LINE_CROSSED' | 'ALERT_LINE_CROSSED'
  | 'PROLONGED_LABOUR' | 'TEMP_HIGH'
  | 'PATIENT_SYMPTOM_REPORT';
export type AlertSeverity = 'WARNING' | 'CRITICAL';

export interface ClinicalAlert {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  partograph_entry: number | null;
  alert_type: AlertType;
  alert_type_display: string;
  severity: AlertSeverity;
  severity_display: string;
  value_triggered: string;
  threshold: string;
  message: string;
  acknowledged: boolean;
  acknowledged_by: number | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AlertCountResponse {
  total: number;
  critical: number;
  recent: ClinicalAlert[];
}

// ─── Staff User (admin management) ───────────────────────────────────────────
export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'NURSE' | 'DOCTOR' | 'MOTHER';
  phone_number: string;
  bio?: string;
  is_active: boolean;
  date_joined: string;
  has_pmtct_permission?: boolean;
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────
export interface AuditEntry {
  history_id: number;
  history_type: '+' | '~' | '-';
  history_date: string;
  history_user: string;
  changes: Record<string, { old: string | null; new: string | null }>;
}

// --- Pediatrics ---
export interface ChildProfile {
  id: number;
  mother: number;
  mother_details?: Patient;
  first_name: string;
  last_name: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  date_of_birth: string;
  birth_weight_kg: string;
  birth_certificate_number: string;
}

export interface GrowthRecord {
  id: number;
  child: number;
  date_recorded: string;
  weight_kg: string;
  height_cm: string;
  head_circumference_cm: string;
  notes: string;
}

export interface VaccinationRecord {
  id: number;
  child: number;
  vaccine_name: string;
  vaccine_name_display?: string;
  expected_date: string;
  given_date: string;
  status: 'PENDING' | 'GIVEN' | 'MISSED';
  status_display?: string;
  notes: string;
}

export interface ChildClinicVisit {
  id: number;
  child: number;
  visit_date: string;
  fever_illness_history: string;
  nutrition_status: string;
  development_milestones: string;
  doctor_recommendations: string;
  next_visit_date: string;
}

// ─── Mother Portal Data Structures ──────────────────────────────────────────
export interface SymptomReport {
  id: number;
  patient: number;
  symptoms: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  reported_at: string;
  status: 'PENDING' | 'REVIEWED';
  reviewed_by: number | null;
  reviewed_at: string | null;
  notes: string;
}

export interface SecureMessage {
  id: number;
  sender: number;
  sender_name?: string;
  sender_role?: string;
  recipient: number | null;
  patient: number;
  message_type?: 'GENERAL' | 'CARE_ALERT';
  clinical_alert?: number | null;
  message: string;
  created_at: string;
  is_read: boolean;
  parent_message: number | null;
}

export interface UpcomingVaccine {
  target: string;
  vaccine_name: string;
  recommended_week: number | null;
  status: 'UPCOMING' | 'DUE' | 'OVERDUE' | 'PENDING' | 'GIVEN' | 'MISSED';
  expected_date: string | null;
}

export interface MotherDashboardData {
  pregnancy_status: string;
  gestational_age_weeks: number;
  expected_delivery_date: string;
  trimester: string | null;
  next_appointment: Appointment | null;
  upcoming_vaccines: UpcomingVaccine[];
  unread_messages_count: number;
  care_alerts: SecureMessage[];
  risk_level: RiskLevel;
}

export interface PregnancyMilestone {
  id: 'REGISTRATION' | 'ANC1' | 'ANC2' | 'ANC3' | 'ANC4' | 'DELIVERY' | 'POSTNATAL';
  name: string;
  completed: boolean;
  date: string | null;
}

export interface MotherPregnancyTrackingData {
  weeks_pregnant: number;
  edd: string;
  lmp: string;
  trimester_info: string;
  milestones: PregnancyMilestone[];
  anc_visits: any[];
}

export interface MotherMedicalRecordsData {
  demographics_and_history: Patient;
  clinical_notes: any[];
  uploaded_documents: any[];
}

