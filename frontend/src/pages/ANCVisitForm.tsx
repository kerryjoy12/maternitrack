import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Baby, 
  TestTube, 
  FileText, 
  Pill, 
  Share2, 
  Calendar, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download,
  Clock,
  ShieldAlert,
  Activity,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { clinicalApi, patientsApi, appointmentsApi } from '../api';
import { Patient, Appointment, ANCVisit } from '../types';

interface ANCVisitFormProps {
  appointmentId?: number;
  patientId?: number;
  visitId?: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ANCVisitForm({ appointmentId, patientId, visitId, onSuccess, onClose }: ANCVisitFormProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 8-Tab Form State
  const [form, setForm] = useState({
    patient: 0,
    pregnancy: null as number | null,
    visit_number: 1,
    visit_date: new Date().toISOString().split('T')[0],
    department: 'ANC Clinic',
    visit_status: 'COMPLETED' as 'DRAFT' | 'COMPLETED',

    // Tab 1: Vitals
    weight_kg: '',
    height_cm: '',
    bp_systolic: '',
    bp_diastolic: '',
    pulse_rate: '',
    respiratory_rate: '',
    temperature_c: '',
    oxygen_saturation: '',
    muac_cm: '',

    // Tab 2: Assessment
    presenting_complaints: '',
    general_examination: '',
    oedema: 'NONE',
    pallor: 'NONE',
    fundal_height_cm: '',
    fetal_heart_rate: '',
    fetal_presentation: 'CEPHALIC',
    fetal_movement: 'NORMAL',

    // Tab 3: Labs
    blood_group_confirmed: '',
    rhesus_factor: 'POSITIVE',
    hemoglobin_gdl: '',
    anemia_severity: 'NORMAL',
    blood_sugar_mgdl: '',
    blood_sugar_type: 'FASTING',
    urine_protein: 'NIL',
    urine_glucose: 'NIL',
    urine_ketones: 'NIL',
    urine_leukocytes: 'NIL',
    urine_nitrites: 'NEGATIVE',
    tb_screening_outcome: 'NEGATIVE',
    ipt_date_given: '',
    ipt_next_visit: '',
    hiv_status: 'NON-REACTIVE',
    hiv_retest_date: '',
    syphilis_status: 'NON-REACTIVE',
    hepatitis_b_surface_ag: 'NON-REACTIVE',
    rubella_igg: 'NEGATIVE',
    couple_hiv_testing_done: false,
    partner_hiv_status: 'NON-REACTIVE',

    // Tab 4: Ultrasound
    ultrasound_done: false,
    scan_date: '',
    ultrasound_gestational_age: '',
    placenta_location: 'ANTERIOR',
    fetal_position: 'CEPHALIC',
    estimated_fetal_weight_g: '',
    amniotic_fluid: 'NORMAL',
    num_fetuses_seen: '1',
    ultrasound_results: '',

    // Tab 5: Clinical Notes
    consultation_notes: '',
    assessment: '',
    diagnosis: '',
    treatment_plan: '',
    complications_noted: '',
    general_notes: '',
    remarks: '',

    // Tab 6: Medications
    medication_prescribed: '',
    supplements_given: 'IFAS (Iron + Folic Acid)',
    health_education_given: 'Birth preparedness, Danger signs in pregnancy, Nutrition',

    // Tab 7: Referrals
    referral_facility: '',
    referral_reason: '',
    referral_date: '',
    referral_status: 'NONE',

    // Tab 8: Appointment
    next_appointment_date: '',
    reminder_status: 'PENDING',
    send_sms_reminder: true,
    send_email_reminder: true,
  });

  useEffect(() => {
    loadData();
  }, [appointmentId, patientId, visitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const patientsRes = await patientsApi.list();
      const pList = patientsRes.data.results ?? patientsRes.data;
      setPatients(pList);

      if (patientId) {
        const pRes = await patientsApi.get(patientId);
        const pData = pRes.data;
        setSelectedPatient(pData);
        setForm(prev => ({
          ...prev,
          patient: pData.id,
          pregnancy: pData.active_pregnancy?.id || null,
          blood_group_confirmed: pData.blood_group || '',
          rhesus_factor: pData.rhesus_factor || 'POSITIVE',
        }));
      }

      if (appointmentId) {
        const apptRes = await appointmentsApi.get(appointmentId);
        const appt = apptRes.data;
        setAppointment(appt);
        setForm(prev => ({
          ...prev,
          patient: appt.patient,
          visit_number: appt.appointment_type === 'ANC1' ? 1 : appt.appointment_type === 'ANC2' ? 2 : appt.appointment_type === 'ANC3' ? 3 : 4,
        }));
      }

      if (visitId) {
        const visitRes = await clinicalApi.getAncVisit(visitId);
        const vData: ANCVisit = visitRes.data;
        setForm(prev => ({
          ...prev,
          ...vData,
          patient: vData.patient,
          weight_kg: vData.weight_kg ? String(vData.weight_kg) : '',
          bp_systolic: vData.bp_systolic ? String(vData.bp_systolic) : '',
          bp_diastolic: vData.bp_diastolic ? String(vData.bp_diastolic) : '',
          pulse_rate: vData.pulse_rate ? String(vData.pulse_rate) : '',
          temperature_c: vData.temperature_c ? String(vData.temperature_c) : '',
          fundal_height_cm: vData.fundal_height_cm ? String(vData.fundal_height_cm) : '',
          fetal_heart_rate: vData.fetal_heart_rate ? String(vData.fetal_heart_rate) : '',
          hemoglobin_gdl: vData.hemoglobin_gdl ? String(vData.hemoglobin_gdl) : '',
        } as any));
      }
    } catch (err) {
      console.error('Failed to load ANC Visit data:', err);
      setError('Could not load patient or visit data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (pId: number) => {
    setForm(prev => ({ ...prev, patient: pId }));
    try {
      const res = await patientsApi.get(pId);
      setSelectedPatient(res.data);
      if (res.data.active_pregnancy) {
        setForm(prev => ({ ...prev, pregnancy: res.data.active_pregnancy.id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Automated BMI Calculation
  const computedBMI = useMemo(() => {
    const w = parseFloat(form.weight_kg);
    const h = parseFloat(form.height_cm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  }, [form.weight_kg, form.height_cm]);

  // Live Clinical Decision Support (CDS) Warnings
  const liveCDSAlerts = useMemo(() => {
    const alerts: { severity: 'WARNING' | 'CRITICAL'; title: string; text: string }[] = [];

    const sys = parseInt(form.bp_systolic);
    const dia = parseInt(form.bp_diastolic);
    if (sys >= 140 || dia >= 90) {
      alerts.push({
        severity: sys >= 160 || dia >= 110 ? 'CRITICAL' : 'WARNING',
        title: 'HYPERTENSION / PRE-ECLAMPSIA RISK',
        text: `BP of ${sys || 0}/${dia || 0} mmHg indicates potential pre-eclampsia. Monitor protein in urine and check for headache or visual disturbance.`,
      });
    }

    const hb = parseFloat(form.hemoglobin_gdl);
    if (hb > 0 && hb < 11.0) {
      alerts.push({
        severity: hb < 7.0 ? 'CRITICAL' : 'WARNING',
        title: 'ANAEMIA ALERT',
        text: `Hemoglobin of ${hb} g/dL indicates ${hb < 7.0 ? 'SEVERE' : hb < 10.0 ? 'MODERATE' : 'MILD'} anaemia. Initiate therapeutic IFAS and dietary intervention.`,
      });
    }

    if (form.hiv_status === 'REACTIVE') {
      alerts.push({
        severity: 'CRITICAL',
        title: 'PMTCT INTERVENTION REQUIRED',
        text: 'Patient registered HIV Reactive. Ensure immediate linkage to PMTCT ART regimen and partner notification.',
      });
    }

    if (form.syphilis_status === 'REACTIVE') {
      alerts.push({
        severity: 'WARNING',
        title: 'SYPHILIS POSITIVE',
        text: 'Initiate Benzathine Penicillin G protocol and schedule partner treatment.',
      });
    }

    const fhr = parseInt(form.fetal_heart_rate);
    if (fhr > 0 && (fhr < 110 || fhr > 160)) {
      alerts.push({
        severity: 'CRITICAL',
        title: 'FETAL DISTRESS WARNING',
        text: `FHR of ${fhr} bpm is outside normal range (110 - 160 bpm). Place mother on left lateral tilt, administer O2, and evaluate immediately.`,
      });
    }

    return alerts;
  }, [form.bp_systolic, form.bp_diastolic, form.hemoglobin_gdl, form.hiv_status, form.syphilis_status, form.fetal_heart_rate]);

  const saveVisit = async (status: 'DRAFT' | 'COMPLETED') => {
    if (!form.patient) {
      setError('Please select a patient before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        visit_status: status,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        bmi: computedBMI ? parseFloat(computedBMI) : null,
        bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
        pulse_rate: form.pulse_rate ? parseInt(form.pulse_rate) : null,
        respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : null,
        temperature_c: form.temperature_c ? parseFloat(form.temperature_c) : null,
        oxygen_saturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
        muac_cm: form.muac_cm ? parseFloat(form.muac_cm) : null,
        fundal_height_cm: form.fundal_height_cm ? parseInt(form.fundal_height_cm) : null,
        fetal_heart_rate: form.fetal_heart_rate ? parseInt(form.fetal_heart_rate) : null,
        hemoglobin_gdl: form.hemoglobin_gdl ? parseFloat(form.hemoglobin_gdl) : null,
        blood_sugar_mgdl: form.blood_sugar_mgdl ? parseFloat(form.blood_sugar_mgdl) : null,
        ultrasound_gestational_age: form.ultrasound_gestational_age ? parseInt(form.ultrasound_gestational_age) : null,
        estimated_fetal_weight_g: form.estimated_fetal_weight_g ? parseInt(form.estimated_fetal_weight_g) : null,
        num_fetuses_seen: form.num_fetuses_seen ? parseInt(form.num_fetuses_seen) : 1,
      };

      if (visitId) {
        await clinicalApi.updateAncVisit(visitId, payload);
        setSuccess('ANC Visit documentation updated successfully.');
      } else {
        await clinicalApi.createAncVisit(payload);
        setSuccess('ANC Visit completed and saved to patient record.');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error saving ANC visit:', err);
      setError(err.response?.data?.detail || 'Failed to save ANC Visit record.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 1, name: '1. Vitals & Biometrics', icon: Heart },
    { id: 2, name: '2. Maternal & Fetal', icon: Baby },
    { id: 3, name: '3. Labs & Screening', icon: TestTube },
    { id: 4, name: '4. Ultrasound', icon: Activity },
    { id: 5, name: '5. Clinical Notes', icon: FileText },
    { id: 6, name: '6. Prescriptions', icon: Pill },
    { id: 7, name: '7. Referrals', icon: Share2 },
    { id: 8, name: '8. Next Visit', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Clock className="w-6 h-6 animate-spin mr-2 text-emerald-600" />
        <span>Loading WHO ANC Documentation Engine...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[85vh]">
      
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Activity className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Antenatal Care (ANC) Clinical Assessment</h1>
            <p className="text-xs text-emerald-100 flex items-center gap-2 mt-0.5">
              <span>WHO 8-Contact ANC Model</span>
              <span>•</span>
              <span>Patient: <strong className="text-white">{selectedPatient ? selectedPatient.full_name : 'Select Patient'}</strong></span>
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/80 hover:text-white" />
          </button>
        )}
      </div>

      {/* Patient Selection & Summary Strip */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Patient:</label>
          <select
            value={form.patient}
            onChange={(e) => handlePatientSelect(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value={0}>-- Select Patient --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.patient_number}) - ANC Stage: {p.clinic_stage}
              </option>
            ))}
          </select>
        </div>

        {selectedPatient && (
          <div className="flex items-center space-x-6 text-xs text-slate-600 dark:text-slate-300">
            <div>Age: <strong className="text-slate-800 dark:text-slate-100">{selectedPatient.age ?? '—'} yrs</strong></div>
            <div>Blood Group: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.blood_group || 'Not Set'}</strong></div>
            <div>Active Gestation: <strong className="text-teal-600 dark:text-teal-400">{selectedPatient.active_pregnancy?.weeks_pregnant ?? selectedPatient.weeks_pregnant ?? '—'} wks</strong></div>
            <div>EDD: <strong className="text-slate-800 dark:text-slate-100">{selectedPatient.active_pregnancy?.edd ?? selectedPatient.edd ?? '—'}</strong></div>
          </div>
        )}
      </div>

      {/* Real-time CDS Safety Alert Banner */}
      {liveCDSAlerts.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span>CLINICAL DECISION SUPPORT (CDS) ALERTS TRIGGERED</span>
          </div>
          {liveCDSAlerts.map((alt, idx) => (
            <div key={idx} className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 ${alt.severity === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-200' : 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200'}`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{alt.title}:</strong> {alt.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* 8 Tab Stepper Navigation */}
      <div className="px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex overflow-x-auto no-scrollbar space-x-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Form Contents */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* TAB 1: VITALS */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>Vital Signs & Biometric Assessments</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                <input
                  type="number" step="0.1" placeholder="e.g. 64.5"
                  value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number" placeholder="e.g. 162"
                  value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calculated BMI (kg/m²)</label>
                <input
                  type="text" disabled value={computedBMI}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">BP Systolic (mmHg)</label>
                <input
                  type="number" placeholder="e.g. 120"
                  value={form.bp_systolic} onChange={e => setForm({ ...form, bp_systolic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">BP Diastolic (mmHg)</label>
                <input
                  type="number" placeholder="e.g. 80"
                  value={form.bp_diastolic} onChange={e => setForm({ ...form, bp_diastolic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pulse Rate (bpm)</label>
                <input
                  type="number" placeholder="e.g. 78"
                  value={form.pulse_rate} onChange={e => setForm({ ...form, pulse_rate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Temperature (°C)</label>
                <input
                  type="number" step="0.1" placeholder="e.g. 36.6"
                  value={form.temperature_c} onChange={e => setForm({ ...form, temperature_c: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">O2 Saturation (%)</label>
                <input
                  type="number" placeholder="e.g. 98"
                  value={form.oxygen_saturation} onChange={e => setForm({ ...form, oxygen_saturation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">MUAC (cm)</label>
                <input
                  type="number" step="0.1" placeholder="e.g. 24.5"
                  value={form.muac_cm} onChange={e => setForm({ ...form, muac_cm: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATERNITY & FETAL */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Baby className="w-4 h-4 text-emerald-600" />
              <span>Maternal Examination & Fetal Wellbeing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Presenting Complaints</label>
                <textarea
                  rows={2} placeholder="Subjective symptoms reported by mother..."
                  value={form.presenting_complaints} onChange={e => setForm({ ...form, presenting_complaints: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">General Examination</label>
                <textarea
                  rows={2} placeholder="Head to toe physical findings..."
                  value={form.general_examination} onChange={e => setForm({ ...form, general_examination: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Oedema (Swelling)</label>
                <select
                  value={form.oedema} onChange={e => setForm({ ...form, oedema: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NONE">None</option>
                  <option value="MILD">Mild (+)</option>
                  <option value="MODERATE">Moderate (++)</option>
                  <option value="SEVERE">Severe (+++)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pallor</label>
                <select
                  value={form.pallor} onChange={e => setForm({ ...form, pallor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NONE">None</option>
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fundal Height (cm)</label>
                <input
                  type="number" placeholder="e.g. 28"
                  value={form.fundal_height_cm} onChange={e => setForm({ ...form, fundal_height_cm: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fetal Heart Rate (bpm)</label>
                <input
                  type="number" placeholder="e.g. 140"
                  value={form.fetal_heart_rate} onChange={e => setForm({ ...form, fetal_heart_rate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fetal Presentation</label>
                <select
                  value={form.fetal_presentation} onChange={e => setForm({ ...form, fetal_presentation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="CEPHALIC">Cephalic (Head First)</option>
                  <option value="BREECH">Breech</option>
                  <option value="TRANSVERSE">Transverse Lie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fetal Movement</label>
                <select
                  value={form.fetal_movement} onChange={e => setForm({ ...form, fetal_movement: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NORMAL">Normal Kicking & Movement</option>
                  <option value="DECREASED">Decreased Movement</option>
                  <option value="ABSENT">Absent Movement</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LABS */}
        {activeTab === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TestTube className="w-4 h-4 text-emerald-600" />
              <span>Laboratory Diagnostic Screening</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hemoglobin (g/dL)</label>
                <input
                  type="number" step="0.1" placeholder="e.g. 11.5"
                  value={form.hemoglobin_gdl} onChange={e => setForm({ ...form, hemoglobin_gdl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number" placeholder="e.g. 95"
                  value={form.blood_sugar_mgdl} onChange={e => setForm({ ...form, blood_sugar_mgdl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Sugar Type</label>
                <select
                  value={form.blood_sugar_type} onChange={e => setForm({ ...form, blood_sugar_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="FASTING">Fasting</option>
                  <option value="RANDOM">Random</option>
                  <option value="OGTT">OGTT 2hr</option>
                </select>
              </div>
            </div>

            {/* Urinalysis */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Urinalysis Dipstick</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Protein</label>
                  <select
                    value={form.urine_protein} onChange={e => setForm({ ...form, urine_protein: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="NIL">Nil</option>
                    <option value="TRACE">Trace</option>
                    <option value="+">+</option>
                    <option value="++">++</option>
                    <option value="+++">+++</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Glucose</label>
                  <select
                    value={form.urine_glucose} onChange={e => setForm({ ...form, urine_glucose: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="NIL">Nil</option>
                    <option value="TRACE">Trace</option>
                    <option value="+">+</option>
                    <option value="++">++</option>
                    <option value="+++">+++</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ketones</label>
                  <select
                    value={form.urine_ketones} onChange={e => setForm({ ...form, urine_ketones: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="NIL">Nil</option>
                    <option value="TRACE">Trace</option>
                    <option value="+">+</option>
                    <option value="++">++</option>
                    <option value="+++">+++</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Infectious Disease Screening */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">HIV Screening</label>
                <select
                  value={form.hiv_status} onChange={e => setForm({ ...form, hiv_status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NON-REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                  <option value="INCONCLUSIVE">Inconclusive</option>
                  <option value="NOT_TESTED">Not Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Syphilis (VDRL/RPR)</label>
                <select
                  value={form.syphilis_status} onChange={e => setForm({ ...form, syphilis_status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NON-REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                  <option value="NOT_TESTED">Not Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hepatitis B Surface Ag</label>
                <select
                  value={form.hepatitis_b_surface_ag} onChange={e => setForm({ ...form, hepatitis_b_surface_ag: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="NON-REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                  <option value="NOT_TESTED">Not Tested</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ULTRASOUND */}
        {activeTab === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Obstetric Ultrasound Findings</span>
            </h3>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <input
                type="checkbox"
                id="us_done"
                checked={form.ultrasound_done}
                onChange={e => setForm({ ...form, ultrasound_done: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="us_done" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Ultrasound Scan Performed During This Visit
              </label>
            </div>

            {form.ultrasound_done && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Placenta Location</label>
                    <input
                      type="text" placeholder="e.g. Anterior, Posterior, Fundal"
                      value={form.placenta_location} onChange={e => setForm({ ...form, placenta_location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Fetal Weight (grams)</label>
                    <input
                      type="number" placeholder="e.g. 1850"
                      value={form.estimated_fetal_weight_g} onChange={e => setForm({ ...form, estimated_fetal_weight_g: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amniotic Fluid Volume</label>
                    <select
                      value={form.amniotic_fluid} onChange={e => setForm({ ...form, amniotic_fluid: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="OLIGOHYDRAMNIOS">Oligohydramnios (Reduced)</option>
                      <option value="POLYHYDRAMNIOS">Polyhydramnios (Excess)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Scan Impressions</label>
                  <textarea
                    rows={3} placeholder="Sonographer / Doctor observations..."
                    value={form.ultrasound_results} onChange={e => setForm({ ...form, ultrasound_results: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CLINICAL NOTES */}
        {activeTab === 5 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Consultation Notes & Clinical Impression</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Consultation Summary / Notes</label>
                <textarea
                  rows={3} placeholder="Detailed notes from clinical history and physical examination..."
                  value={form.consultation_notes} onChange={e => setForm({ ...form, consultation_notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Diagnosis / Assessment</label>
                <textarea
                  rows={2} placeholder="e.g. G2P1 at 28 weeks gestation, normal progression, mild anaemia"
                  value={form.assessment} onChange={e => setForm({ ...form, assessment: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Complications Noted (if any)</label>
                <input
                  type="text" placeholder="e.g. Gestational Hypertension, Pre-eclampsia risk"
                  value={form.complications_noted} onChange={e => setForm({ ...form, complications_noted: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-rose-600 dark:text-rose-400 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PRESCRIPTIONS */}
        {activeTab === 6 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Prescriptions, Supplements & Counselling</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Supplements Administered</label>
                <input
                  type="text" placeholder="e.g. IFAS (Iron 60mg + Folic Acid 0.4mg daily)"
                  value={form.supplements_given} onChange={e => setForm({ ...form, supplements_given: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Other Prescribed Medications</label>
                <textarea
                  rows={2} placeholder="Medication dosage, frequency and instructions..."
                  value={form.medication_prescribed} onChange={e => setForm({ ...form, medication_prescribed: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Health Education & Counselling Given</label>
                <textarea
                  rows={2} placeholder="Topics discussed (e.g. Danger signs, Individual birth plan, Deworming)..."
                  value={form.health_education_given} onChange={e => setForm({ ...form, health_education_given: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: REFERRALS */}
        {activeTab === 7 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Inter-Facility Referral Management</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Facility</label>
                  <input
                    type="text" placeholder="e.g. Kisii Teaching & Referral Hospital"
                    value={form.referral_facility} onChange={e => setForm({ ...form, referral_facility: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Referral Status</label>
                  <select
                    value={form.referral_status} onChange={e => setForm({ ...form, referral_status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  >
                    <option value="NONE">No Referral</option>
                    <option value="PENDING">Pending Transfer</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Referral</label>
                <textarea
                  rows={2} placeholder="Clinical indications requiring specialized care..."
                  value={form.referral_reason} onChange={e => setForm({ ...form, referral_reason: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: NEXT VISIT */}
        {activeTab === 8 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Next Contact Schedule & Patient Reminders</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Next Appointment Date</label>
                <input
                  type="date"
                  value={form.next_appointment_date} onChange={e => setForm({ ...form, next_appointment_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex flex-col justify-center space-y-2 pt-4">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.send_sms_reminder} onChange={e => setForm({ ...form, send_sms_reminder: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Send Automated SMS Appointment Reminder</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.send_email_reminder} onChange={e => setForm({ ...form, send_email_reminder: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Send Email Reminder</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Action Footer */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {activeTab > 1 && (
            <button
              onClick={() => setActiveTab(prev => prev - 1)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 min-h-[40px]"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          )}
          {activeTab < 8 && (
            <button
              onClick={() => setActiveTab(prev => prev + 1)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 min-h-[40px]"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveVisit('DRAFT')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 min-h-[40px]"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveVisit('COMPLETED')}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50 min-h-[40px]"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Visit</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}