import { useEffect, useState, FormEvent } from 'react';
import { 
  ArrowUpRight, 
  MapPin, 
  User, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  X,
  Truck,
  Printer,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { referralsApi, patientsApi } from '../api';
import { Patient } from '../types';
import { formatDate } from '../utils';

interface Referral {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  referred_by: number;
  referred_by_name: string;
  referral_date: string;
  destination_facility: string;
  reason: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  clinical_summary: string;
  transport_mode: 'AMBULANCE' | 'PRIVATE' | 'PUBLIC';
  feedback_received: boolean;
  outcome_notes: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
  created_at: string;
  updated_at: string;

  // Kisii County fields
  serial_no?: string;
  referring_facility_name?: string;
  referring_facility_mfl?: string;
  referring_facility_contacts?: string;
  receiving_facility_mfl?: string;
  receiving_facility_contacts?: string;
  referral_time?: string;
  admission_date?: string;
  admission_time?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_ip_op_no?: string;
  patient_diagnosis?: string;
  next_of_kin_contacts?: string;
  history_illness_injury?: string;
  medical_surgical_history?: string;
  allergies?: string;
  anc_visits_count?: number;
  anc_facility?: string;
  tt_dose?: string;
  para?: number;
  gravida?: number;
  hiv_status?: string;
  syphilis_status?: string;
  hb_level?: string;
  blood_group?: string;
  rhesus_factor?: string;
  fundal_height?: number;
  fetal_lie?: string;
  fetal_presentation?: string;
  fetal_position?: string;
  cervical_dilatation?: string;
  presenting_part?: string;
  membranes_status?: string;
  fetal_heart_rate?: number;
  spo2?: number;
  pulse_rate?: number;
  respiratory_rate?: number;
  blood_pressure?: string;
  temperature?: string;
  investigations_done?: string;
  treatment_interventions?: string;
  ambulance_first_call_time?: string;
  ambulance_call_received_time?: string;
  ambulance_dispatched_time?: string;
  ambulance_arrival_scene_time?: string;
  ambulance_departure_facility_time?: string;
  ambulance_arrival_hospital_time?: string;
  gcs_eye?: number;
  gcs_motor?: number;
  gcs_verbal?: number;
  gcs_score_total?: number;
  crew_1_name?: string;
  crew_1_sign?: string;
  crew_2_name?: string;
  crew_2_sign?: string;
  ambulance_reg_no?: string;
  receiving_hospital?: string;
  staff_handed_over?: string;
  handover_date?: string;
  handover_time?: string;
  call_made_by?: string;
  call_made_by_designation?: string;
  call_made_by_time?: string;
  call_received_by?: string;
  call_received_by_designation?: string;
  call_received_by_time?: string;
  comments?: string;
}

interface Facility {
  id: number;
  code: string;
  name: string;
  county: string;
}

const URGENCY_COLORS = {
  ROUTINE: 'blue',
  URGENT: 'warning',
  EMERGENCY: 'danger',
};

const STATUS_COLORS = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  COMPLETED: 'success',
  DECLINED: 'danger',
};

export default function Referrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'facility' | 'clinical' | 'vitals' | 'ambulance'>('facility');
  const [patientId, setPatientId] = useState<number | ''>('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split('T')[0]);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [suggestedFacilities, setSuggestedFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [transportMode, setTransportMode] = useState<'AMBULANCE' | 'PRIVATE' | 'PUBLIC'>('PUBLIC');

  // Unified Form Data State for Kisii County Fields
  const [formData, setFormData] = useState({
    serial_no: '',
    referring_facility_name: '',
    referring_facility_mfl: '',
    referring_facility_contacts: '',
    receiving_facility_mfl: '',
    receiving_facility_contacts: '',
    referral_time: '',
    admission_date: '',
    admission_time: '',
    patient_age: '',
    patient_gender: '',
    patient_ip_op_no: '',
    patient_diagnosis: '',
    next_of_kin_contacts: '',
    history_illness_injury: '',
    medical_surgical_history: '',
    allergies: '',
    anc_visits_count: '',
    anc_facility: '',
    tt_dose: '',
    para: '',
    gravida: '',
    hiv_status: '',
    syphilis_status: '',
    hb_level: '',
    blood_group: '',
    rhesus_factor: '',
    fundal_height: '',
    fetal_lie: '',
    fetal_presentation: '',
    fetal_position: '',
    cervical_dilatation: '',
    presenting_part: '',
    membranes_status: '',
    fetal_heart_rate: '',
    spo2: '',
    pulse_rate: '',
    respiratory_rate: '',
    blood_pressure: '',
    temperature: '',
    investigations_done: '',
    treatment_interventions: '',
    ambulance_first_call_time: '',
    ambulance_call_received_time: '',
    ambulance_dispatched_time: '',
    ambulance_arrival_scene_time: '',
    ambulance_departure_facility_time: '',
    ambulance_arrival_hospital_time: '',
    gcs_eye: '',
    gcs_motor: '',
    gcs_verbal: '',
    crew_1_name: '',
    crew_1_sign: '',
    crew_2_name: '',
    crew_2_sign: '',
    ambulance_reg_no: '',
    receiving_hospital: '',
    staff_handed_over: '',
    handover_date: '',
    handover_time: '',
    call_made_by: '',
    call_made_by_designation: '',
    call_made_by_time: '',
    call_received_by: '',
    call_received_by_designation: '',
    call_received_by_time: '',
    comments: ''
  });

  // Detailed Form View State
  const [selectedViewReferral, setSelectedViewReferral] = useState<Referral | null>(null);

  // Update Modal State
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [status, setStatus] = useState<Referral['status']>('PENDING');

  const gcsTotal = (Number(formData.gcs_eye) || 0) + (Number(formData.gcs_motor) || 0) + (Number(formData.gcs_verbal) || 0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [rRes, pRes] = await Promise.all([
        referralsApi.list(),
        patientsApi.list({ limit: '100' })
      ]);
      setReferrals(rRes.data.results ?? rRes.data);
      setPatients(pRes.data.results ?? pRes.data);
    } catch (err) {
      setError('Unable to retrieve clinical referrals. Please check your network connection, refresh the page, or contact system support if the issue persists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search facilities for autocomplete
  useEffect(() => {
    if (destinationSearch.length < 2) {
      setSuggestedFacilities([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await referralsApi.facilities(destinationSearch);
        setSuggestedFacilities(data.results ?? data);
      } catch {
        setSuggestedFacilities([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destinationSearch]);

  const handlePatientChange = (pId: number | '') => {
    setPatientId(pId);
    if (!pId) return;
    const p = patients.find(patient => patient.id === pId);
    if (p) {
      setFormData(prev => ({
        ...prev,
        patient_age: p.age ? String(p.age) : '',
        patient_gender: p.gender || '',
        patient_ip_op_no: p.patient_number || '',
        next_of_kin_contacts: p.next_of_kin_phone || '',
        medical_surgical_history: `${p.medical_history || ''}\n${p.surgical_history || ''}`.trim(),
        allergies: p.allergies || '',
        gravida: p.gravida ? String(p.gravida) : '',
        para: p.parity ? String(p.parity) : '',
        blood_group: p.blood_group || '',
        referring_facility_name: p.health_facility_name || '',
        referring_facility_mfl: p.kmhfl_code || ''
      }));
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    const facilityName = selectedFacility 
      ? `${selectedFacility.code} — ${selectedFacility.name}`
      : destinationSearch;

    if (!facilityName) {
      setError('Please select or specify a destination facility.');
      return;
    }

    try {
      const payload = {
        patient: patientId,
        referral_date: referralDate,
        destination_facility: facilityName,
        reason,
        urgency,
        clinical_summary: clinicalSummary,
        transport_mode: transportMode,
        status: 'PENDING',
        ...Object.fromEntries(
          Object.entries(formData).map(([k, v]) => {
            if (v === '') return [k, null];
            if ([
              'patient_age', 'anc_visits_count', 'para', 'gravida', 
              'fetal_heart_rate', 'spo2', 'pulse_rate', 'respiratory_rate', 
              'gcs_eye', 'gcs_motor', 'gcs_verbal', 'fundal_height'
            ].includes(k)) {
              return [k, parseInt(v, 10)];
            }
            if (k === 'hb_level' || k === 'temperature') {
              return [k, parseFloat(v)];
            }
            return [k, v];
          })
        ),
        gcs_score_total: gcsTotal > 0 ? gcsTotal : null
      };

      await referralsApi.create(payload);
      setIsCreateOpen(false);
      resetCreateForm();
      loadData();
    } catch (err: any) {
      setError('Failed to log referral. Please check that all required fields are filled, verify the destination facility code/name, and ensure the server is online.');
    }
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      await referralsApi.update(selectedReferral.id, {
        feedback_received: feedbackReceived,
        outcome_notes: outcomeNotes,
        status: status,
      });
      setIsUpdateOpen(false);
      setSelectedReferral(null);
      loadData();
    } catch (err) {
      setError('Failed to update referral outcome. Please check your network connection and try again.');
    }
  };

  const resetCreateForm = () => {
    setPatientId('');
    setReferralDate(new Date().toISOString().split('T')[0]);
    setDestinationSearch('');
    setSelectedFacility(null);
    setSuggestedFacilities([]);
    setReason('');
    setUrgency('ROUTINE');
    setClinicalSummary('');
    setTransportMode('PUBLIC');
    setActiveTab('facility');
    setFormData({
      serial_no: '',
      referring_facility_name: '',
      referring_facility_mfl: '',
      referring_facility_contacts: '',
      receiving_facility_mfl: '',
      receiving_facility_contacts: '',
      referral_time: '',
      admission_date: '',
      admission_time: '',
      patient_age: '',
      patient_gender: '',
      patient_ip_op_no: '',
      patient_diagnosis: '',
      next_of_kin_contacts: '',
      history_illness_injury: '',
      medical_surgical_history: '',
      allergies: '',
      anc_visits_count: '',
      anc_facility: '',
      tt_dose: '',
      para: '',
      gravida: '',
      hiv_status: '',
      syphilis_status: '',
      hb_level: '',
      blood_group: '',
      rhesus_factor: '',
      fundal_height: '',
      fetal_lie: '',
      fetal_presentation: '',
      fetal_position: '',
      cervical_dilatation: '',
      presenting_part: '',
      membranes_status: '',
      fetal_heart_rate: '',
      spo2: '',
      pulse_rate: '',
      respiratory_rate: '',
      blood_pressure: '',
      temperature: '',
      investigations_done: '',
      treatment_interventions: '',
      ambulance_first_call_time: '',
      ambulance_call_received_time: '',
      ambulance_dispatched_time: '',
      ambulance_arrival_scene_time: '',
      ambulance_departure_facility_time: '',
      ambulance_arrival_hospital_time: '',
      gcs_eye: '',
      gcs_motor: '',
      gcs_verbal: '',
      crew_1_name: '',
      crew_1_sign: '',
      crew_2_name: '',
      crew_2_sign: '',
      ambulance_reg_no: '',
      receiving_hospital: '',
      staff_handed_over: '',
      handover_date: '',
      handover_time: '',
      call_made_by: '',
      call_made_by_designation: '',
      call_made_by_time: '',
      call_received_by: '',
      call_received_by_designation: '',
      call_received_by_time: '',
      comments: ''
    });
    setError('');
  };

  const openUpdateModal = (ref: Referral) => {
    setSelectedReferral(ref);
    setFeedbackReceived(ref.feedback_received);
    setOutcomeNotes(ref.outcome_notes);
    setStatus(ref.status);
    setIsUpdateOpen(true);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <ArrowUpRight className="text-primary" size={28} /> Clinical Referral Tracking
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
          >
            <Plus size={16} /> Create Referral
          </button>
        </div>
      </header>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger flex items-center gap-2 mb-4">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : referrals.length === 0 ? (
          <div className="card empty-state" style={{ padding: '40px' }}>
            <ArrowUpRight size={48} className="text-muted opacity-20 mb-3" />
            <h3>No referrals tracked yet</h3>
            <p className="text-muted">This section tracks patient transfers to other facilities. Click 'Create Referral' at the top right to start logging a new Kisii County Adult Referral Form.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {referrals.map((ref) => (
              <div key={ref.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex-between flex-wrap gap-4 mb-3">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }} className="flex items-center gap-2 text-primary">
                        <User size={16} /> {ref.patient_name} ({ref.patient_number})
                      </h3>
                      <div className="text-muted flex items-center gap-1 mt-1" style={{ fontSize: '0.85rem' }}>
                        <MapPin size={14} /> Referred to: <strong>{ref.destination_facility}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${URGENCY_COLORS[ref.urgency]}`}>{ref.urgency}</span>
                      <span className={`badge badge-${STATUS_COLORS[ref.status]}`}>{ref.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted block">Referral Date</span>
                      <strong>{formatDate(ref.referral_date)} {ref.referral_time || ''}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Serial No.</span>
                      <strong>{ref.serial_no || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Transport Mode</span>
                      <strong className="flex items-center gap-1"><Truck size={14} /> {ref.transport_mode}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Referred By</span>
                      <strong>{ref.referred_by_name || 'Staff'}</strong>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-muted block" style={{ fontSize: '0.85rem' }}>Reason for Referral</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{ref.reason}</p>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <button 
                      className="btn btn-outline btn-sm flex items-center gap-1"
                      onClick={() => setSelectedViewReferral(ref)}
                    >
                      <ClipboardList size={14} /> View Full Kisii County Form
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm flex items-center gap-1"
                      onClick={() => openUpdateModal(ref)}
                    >
                      <CheckCircle size={14} /> Update Outcome / Feedback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <ArrowUpRight className="text-primary" /> Create Kisii County Adult Referral
              </h3>
              <button className="btn-close" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              {/* Tab Navigation */}
              <div className="flex border-b px-6 pt-2 overflow-x-auto gap-2" style={{ background: 'var(--bg-card)' }}>
                {[
                  { key: 'facility', label: '1. Facility & Patient' },
                  { key: 'clinical', label: '2. Clinical & OBS/GYN' },
                  { key: 'vitals', label: '3. Vitals & GCS' },
                  { key: 'ambulance', label: '4. Ambulance & Dispatch' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted hover:text-primary'
                    }`}
                    onClick={() => setActiveTab(tab.key as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '24px' }}>
                
                {/* TAB 1: FACILITY & PATIENT */}
                {activeTab === 'facility' && (
                  <div>
                    <h4 className="border-b pb-2 mb-4 text-primary font-bold">Facility & Record Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Serial No.
                        <input
                          type="text"
                          value={formData.serial_no}
                          onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                          placeholder="e.g. 4529"
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Referral Date *
                        <input
                          type="date"
                          value={referralDate}
                          onChange={(e) => setReferralDate(e.target.value)}
                          className="form-input"
                          required
                        />
                      </label>
                      <label className="form-label">
                        Referral Time
                        <input
                          type="time"
                          value={formData.referral_time}
                          onChange={(e) => setFormData({...formData, referral_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Referring Facility
                        <input
                          type="text"
                          value={formData.referring_facility_name}
                          onChange={(e) => setFormData({...formData, referring_facility_name: e.target.value})}
                          className="form-input"
                          placeholder="Referring facility name"
                        />
                      </label>
                      <label className="form-label">
                        Referring MFL Code
                        <input
                          type="text"
                          value={formData.referring_facility_mfl}
                          onChange={(e) => setFormData({...formData, referring_facility_mfl: e.target.value})}
                          className="form-input"
                          placeholder="MFL code"
                        />
                      </label>
                      <label className="form-label">
                        Referring Contacts
                        <input
                          type="text"
                          value={formData.referring_facility_contacts}
                          onChange={(e) => setFormData({...formData, referring_facility_contacts: e.target.value})}
                          className="form-input"
                          placeholder="Facility contact numbers"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div style={{ position: 'relative' }}>
                        <label className="form-label">
                          Receiving Facility (Destination) *
                          <input
                            type="text"
                            value={destinationSearch}
                            onChange={(e) => {
                              setDestinationSearch(e.target.value);
                              if (selectedFacility) setSelectedFacility(null);
                            }}
                            placeholder="Search KMHFL facilities..."
                            className="form-input"
                            required
                          />
                        </label>
                        {suggestedFacilities.length > 0 && !selectedFacility && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            zIndex: 1000,
                            maxHeight: '150px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}>
                            {suggestedFacilities.map(f => (
                              <div
                                key={f.id}
                                onClick={() => {
                                  setSelectedFacility(f);
                                  setDestinationSearch(`${f.code} — ${f.name}`);
                                  setFormData({
                                    ...formData,
                                    receiving_facility_mfl: f.code
                                  });
                                  setSuggestedFacilities([]);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  borderBottom: '1px solid var(--border)',
                                }}
                                className="hover:bg-primary-light"
                              >
                                <strong>{f.code}</strong> — {f.name} ({f.county})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <label className="form-label">
                        Receiving MFL Code
                        <input
                          type="text"
                          value={formData.receiving_facility_mfl}
                          onChange={(e) => setFormData({...formData, receiving_facility_mfl: e.target.value})}
                          className="form-input"
                          placeholder="MFL code"
                        />
                      </label>
                      <label className="form-label">
                        Receiving Contacts
                        <input
                          type="text"
                          value={formData.receiving_facility_contacts}
                          onChange={(e) => setFormData({...formData, receiving_facility_contacts: e.target.value})}
                          className="form-input"
                          placeholder="Receiving contact numbers"
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Patient Snapshot Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Select Registered Patient *
                        <select
                          value={patientId}
                          onChange={(e) => handlePatientChange(e.target.value ? Number(e.target.value) : '')}
                          className="form-select"
                          required
                        >
                          <option value="">-- Choose Patient --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="form-label">
                        IP/OP No.
                        <input
                          type="text"
                          value={formData.patient_ip_op_no}
                          onChange={(e) => setFormData({...formData, patient_ip_op_no: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <label className="form-label">
                        Age
                        <input
                          type="number"
                          value={formData.patient_age}
                          onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Gender
                        <select
                          value={formData.patient_gender}
                          onChange={(e) => setFormData({...formData, patient_gender: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- Gender --</option>
                          <option value="F">Female</option>
                          <option value="M">Male</option>
                          <option value="O">Other</option>
                        </select>
                      </label>
                      <label className="form-label font-medium">
                        Next of Kin Contacts
                        <input
                          type="text"
                          value={formData.next_of_kin_contacts}
                          onChange={(e) => setFormData({...formData, next_of_kin_contacts: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Urgency *
                        <select
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value as any)}
                          className="form-select"
                        >
                          <option value="ROUTINE">Routine</option>
                          <option value="URGENT">Urgent</option>
                          <option value="EMERGENCY">Emergency</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Date of Admission (at current/receiving facility)
                        <input
                          type="date"
                          value={formData.admission_date}
                          onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Admission Time
                        <input
                          type="time"
                          value={formData.admission_time}
                          onChange={(e) => setFormData({...formData, admission_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: CLINICAL & OBS/GYN HISTORY */}
                {activeTab === 'clinical' && (
                  <div>
                    <h4 className="border-b pb-2 mb-4 text-primary font-bold">General Clinical Details</h4>
                    <div className="mb-4">
                      <label className="form-label">
                        History of Illness/Injury
                        <textarea
                          value={formData.history_illness_injury}
                          onChange={(e) => setFormData({...formData, history_illness_injury: e.target.value})}
                          className="form-textarea"
                          rows={2}
                          placeholder="Details of symptoms, duration, history of illness..."
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Medical/Surgical History
                        <textarea
                          value={formData.medical_surgical_history}
                          onChange={(e) => setFormData({...formData, medical_surgical_history: e.target.value})}
                          className="form-textarea"
                          rows={2}
                          placeholder="Chronic illnesses, surgeries..."
                        />
                      </label>
                      <label className="form-label">
                        Allergies
                        <textarea
                          value={formData.allergies}
                          onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                          className="form-textarea"
                          rows={2}
                          placeholder="Food, drug, environmental allergies..."
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Maternal / OBS / GYN History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        No. of ANC Visits
                        <input
                          type="number"
                          value={formData.anc_visits_count}
                          onChange={(e) => setFormData({...formData, anc_visits_count: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        ANC Clinic / Facility
                        <input
                          type="text"
                          value={formData.anc_facility}
                          onChange={(e) => setFormData({...formData, anc_facility: e.target.value})}
                          className="form-input"
                          placeholder="Where ANC care was given"
                        />
                      </label>
                      <label className="form-label">
                        TT Dose Received
                        <select
                          value={formData.tt_dose}
                          onChange={(e) => setFormData({...formData, tt_dose: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- TT Dose --</option>
                          <option value="1">1st TT</option>
                          <option value="2">2nd TT</option>
                          <option value="3">3rd TT</option>
                          <option value="4">4th TT</option>
                          <option value="5">5th TT</option>
                          <option value="NIL">Nil</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <label className="form-label">
                        Parity (Para)
                        <input
                          type="number"
                          value={formData.para}
                          onChange={(e) => setFormData({...formData, para: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Gravida
                        <input
                          type="number"
                          value={formData.gravida}
                          onChange={(e) => setFormData({...formData, gravida: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Blood Group
                        <input
                          type="text"
                          value={formData.blood_group}
                          onChange={(e) => setFormData({...formData, blood_group: e.target.value})}
                          className="form-input"
                          placeholder="e.g. A, B, O"
                        />
                      </label>
                      <label className="form-label">
                        Rhesus Factor
                        <select
                          value={formData.rhesus_factor}
                          onChange={(e) => setFormData({...formData, rhesus_factor: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- Rh --</option>
                          <option value="Positive">+</option>
                          <option value="Negative">-</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        HIV Status
                        <input
                          type="text"
                          value={formData.hiv_status}
                          onChange={(e) => setFormData({...formData, hiv_status: e.target.value})}
                          className="form-input"
                          placeholder="Reactive / Non-reactive"
                        />
                      </label>
                      <label className="form-label">
                        Syphilis Status
                        <input
                          type="text"
                          value={formData.syphilis_status}
                          onChange={(e) => setFormData({...formData, syphilis_status: e.target.value})}
                          className="form-input"
                          placeholder="Positive / Negative"
                        />
                      </label>
                      <label className="form-label">
                        Hemoglobin (Hb) Level (g/dL)
                        <input
                          type="number"
                          step="0.1"
                          value={formData.hb_level}
                          onChange={(e) => setFormData({...formData, hb_level: e.target.value})}
                          className="form-input"
                          placeholder="e.g. 11.5"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <label className="form-label">
                        Fundal Height (cm)
                        <input
                          type="number"
                          value={formData.fundal_height}
                          onChange={(e) => setFormData({...formData, fundal_height: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Lie
                        <input
                          type="text"
                          value={formData.fetal_lie}
                          onChange={(e) => setFormData({...formData, fetal_lie: e.target.value})}
                          className="form-input"
                          placeholder="Longitudinal, Transverse..."
                        />
                      </label>
                      <label className="form-label">
                        Presentation
                        <input
                          type="text"
                          value={formData.fetal_presentation}
                          onChange={(e) => setFormData({...formData, fetal_presentation: e.target.value})}
                          className="form-input"
                          placeholder="Cephalic, Breech..."
                        />
                      </label>
                      <label className="form-label">
                        Position
                        <input
                          type="text"
                          value={formData.fetal_position}
                          onChange={(e) => setFormData({...formData, fetal_position: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        VE: Cervical Dilatation (cm / fully)
                        <input
                          type="text"
                          value={formData.cervical_dilatation}
                          onChange={(e) => setFormData({...formData, cervical_dilatation: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Presenting Part
                        <input
                          type="text"
                          value={formData.presenting_part}
                          onChange={(e) => setFormData({...formData, presenting_part: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Membranes Status (Intact / Ruptured)
                        <input
                          type="text"
                          value={formData.membranes_status}
                          onChange={(e) => setFormData({...formData, membranes_status: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 3: VITALS & GCS */}
                {activeTab === 'vitals' && (
                  <div>
                    <h4 className="border-b pb-2 mb-4 text-primary font-bold">Observations / Vitals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label font-bold">
                        Fetal Heart Rate (bpm)
                        <input
                          type="number"
                          value={formData.fetal_heart_rate}
                          onChange={(e) => setFormData({...formData, fetal_heart_rate: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        SpO₂ (%)
                        <input
                          type="number"
                          value={formData.spo2}
                          onChange={(e) => setFormData({...formData, spo2: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Pulse Rate (bpm)
                        <input
                          type="number"
                          value={formData.pulse_rate}
                          onChange={(e) => setFormData({...formData, pulse_rate: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Breathing / Respiratory Rate (rpm)
                        <input
                          type="number"
                          value={formData.respiratory_rate}
                          onChange={(e) => setFormData({...formData, respiratory_rate: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Blood Pressure
                        <input
                          type="text"
                          value={formData.blood_pressure}
                          onChange={(e) => setFormData({...formData, blood_pressure: e.target.value})}
                          className="form-input"
                          placeholder="e.g. 120/80"
                        />
                      </label>
                      <label className="form-label">
                        Temperature (°C)
                        <input
                          type="number"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                          className="form-input"
                          placeholder="e.g. 36.8"
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Glasgow Coma Scale (GCS)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <label className="form-label">
                        Eye Opening
                        <select
                          value={formData.gcs_eye}
                          onChange={(e) => setFormData({...formData, gcs_eye: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- Choose (1-4) --</option>
                          <option value="4">4. Spontaneously</option>
                          <option value="3">3. To voice</option>
                          <option value="2">2. To pain</option>
                          <option value="1">1. No response</option>
                        </select>
                      </label>
                      <label className="form-label">
                        Motor Response
                        <select
                          value={formData.gcs_motor}
                          onChange={(e) => setFormData({...formData, gcs_motor: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- Choose (1-6) --</option>
                          <option value="6">6. Obey commands</option>
                          <option value="5">5. Locates pain</option>
                          <option value="4">4. Withdraws from pain</option>
                          <option value="3">3. Flexion to pain</option>
                          <option value="2">2. Extension to pain</option>
                          <option value="1">1. No response</option>
                        </select>
                      </label>
                      <label className="form-label">
                        Verbal Response
                        <select
                          value={formData.gcs_verbal}
                          onChange={(e) => setFormData({...formData, gcs_verbal: e.target.value})}
                          className="form-select"
                        >
                          <option value="">-- Choose (1-5) --</option>
                          <option value="5">5. Oriented</option>
                          <option value="4">4. Confused</option>
                          <option value="3">3. Inappropriate</option>
                          <option value="2">2. Incomprehensible</option>
                          <option value="1">1. No response</option>
                        </select>
                      </label>
                      <div className="form-label">
                        Total GCS Score
                        <div className="form-input flex items-center bg-gray-100" style={{ background: 'var(--bg-input)' }}>
                          <strong>{gcsTotal > 0 ? `${gcsTotal} / 15` : 'N/A'}</strong>
                        </div>
                      </div>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Assessments & Treatments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Assessments / Investigations Done
                        <textarea
                          value={formData.investigations_done}
                          onChange={(e) => setFormData({...formData, investigations_done: e.target.value})}
                          className="form-textarea"
                          rows={3}
                          placeholder="List key laboratory tests, ultrasound results..."
                        />
                      </label>
                      <label className="form-label">
                        Treatment / Interventions Given
                        <textarea
                          value={formData.treatment_interventions}
                          onChange={(e) => setFormData({...formData, treatment_interventions: e.target.value})}
                          className="form-textarea"
                          rows={3}
                          placeholder="IV fluids, medications, oxygen, resuscitations..."
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 4: AMBULANCE & DISPATCH */}
                {activeTab === 'ambulance' && (
                  <div>
                    <h4 className="border-b pb-2 mb-4 text-primary font-bold">Ambulance logs & Times</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        First Call Made (from Facility)
                        <input
                          type="time"
                          value={formData.ambulance_first_call_time}
                          onChange={(e) => setFormData({...formData, ambulance_first_call_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Call Received (Call Center)
                        <input
                          type="time"
                          value={formData.ambulance_call_received_time}
                          onChange={(e) => setFormData({...formData, ambulance_call_received_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Ambulance Dispatched
                        <input
                          type="time"
                          value={formData.ambulance_dispatched_time}
                          onChange={(e) => setFormData({...formData, ambulance_dispatched_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Arrival at Scene
                        <input
                          type="time"
                          value={formData.ambulance_arrival_scene_time}
                          onChange={(e) => setFormData({...formData, ambulance_arrival_scene_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Departure from Facility
                        <input
                          type="time"
                          value={formData.ambulance_departure_facility_time}
                          onChange={(e) => setFormData({...formData, ambulance_departure_facility_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Arrival at Hospital
                        <input
                          type="time"
                          value={formData.ambulance_arrival_hospital_time}
                          onChange={(e) => setFormData({...formData, ambulance_arrival_hospital_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Transport Mode *
                        <select
                          value={transportMode}
                          onChange={(e) => setTransportMode(e.target.value as any)}
                          className="form-select"
                        >
                          <option value="PUBLIC">Public Transport</option>
                          <option value="PRIVATE">Private Vehicle</option>
                          <option value="AMBULANCE">Ambulance</option>
                        </select>
                      </label>
                      <label className="form-label">
                        Ambulance Registration No.
                        <input
                          type="text"
                          value={formData.ambulance_reg_no}
                          onChange={(e) => setFormData({...formData, ambulance_reg_no: e.target.value})}
                          className="form-input"
                          placeholder="e.g. KAA 123A"
                        />
                      </label>
                      <label className="form-label">
                        Receiving Hospital name
                        <input
                          type="text"
                          value={formData.receiving_hospital}
                          onChange={(e) => setFormData({...formData, receiving_hospital: e.target.value})}
                          className="form-input"
                          placeholder="Hospital Name"
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Logistics & Call Registry</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Referral Called By (Name)
                        <input
                          type="text"
                          value={formData.call_made_by}
                          onChange={(e) => setFormData({...formData, call_made_by: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Designation
                        <input
                          type="text"
                          value={formData.call_made_by_designation}
                          onChange={(e) => setFormData({...formData, call_made_by_designation: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Call Time
                        <input
                          type="time"
                          value={formData.call_made_by_time}
                          onChange={(e) => setFormData({...formData, call_made_by_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Call Received By (Name)
                        <input
                          type="text"
                          value={formData.call_received_by}
                          onChange={(e) => setFormData({...formData, call_received_by: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Designation
                        <input
                          type="text"
                          value={formData.call_received_by_designation}
                          onChange={(e) => setFormData({...formData, call_received_by_designation: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Received Time
                        <input
                          type="time"
                          value={formData.call_received_by_time}
                          onChange={(e) => setFormData({...formData, call_received_by_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Crew & Handover</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Crew 1 (Name)
                        <input
                          type="text"
                          value={formData.crew_1_name}
                          onChange={(e) => setFormData({...formData, crew_1_name: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Crew 1 Sign / Initials
                        <input
                          type="text"
                          value={formData.crew_1_sign}
                          onChange={(e) => setFormData({...formData, crew_1_sign: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Crew 2 (Name)
                        <input
                          type="text"
                          value={formData.crew_2_name}
                          onChange={(e) => setFormData({...formData, crew_2_name: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Crew 2 Sign / Initials
                        <input
                          type="text"
                          value={formData.crew_2_sign}
                          onChange={(e) => setFormData({...formData, crew_2_sign: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <label className="form-label">
                        Staff Handed Over
                        <input
                          type="text"
                          value={formData.staff_handed_over}
                          onChange={(e) => setFormData({...formData, staff_handed_over: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Handover Date
                        <input
                          type="date"
                          value={formData.handover_date}
                          onChange={(e) => setFormData({...formData, handover_date: e.target.value})}
                          className="form-input"
                        />
                      </label>
                      <label className="form-label">
                        Handover Time
                        <input
                          type="time"
                          value={formData.handover_time}
                          onChange={(e) => setFormData({...formData, handover_time: e.target.value})}
                          className="form-input"
                        />
                      </label>
                    </div>

                    <h4 className="border-b pb-2 mb-4 mt-6 text-primary font-bold">Referral Reasons & Comments</h4>
                    <div className="mb-4">
                      <label className="form-label font-bold">
                        Reason for Referral *
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="form-textarea"
                          rows={2}
                          placeholder="Provide specific medical reason for referral..."
                          required
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <label className="form-label">
                        Clinical Summary
                        <textarea
                          value={clinicalSummary}
                          onChange={(e) => setClinicalSummary(e.target.value)}
                          className="form-textarea"
                          rows={2}
                          placeholder="Vitals, symptoms, medications given..."
                        />
                      </label>
                      <label className="form-label">
                        Comments / Remarks
                        <textarea
                          value={formData.comments}
                          onChange={(e) => setFormData({...formData, comments: e.target.value})}
                          className="form-textarea"
                          rows={2}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                {activeTab !== 'ambulance' ? (
                  <button 
                    type="button" 
                    className="btn btn-outline flex items-center gap-1"
                    onClick={() => {
                      if (activeTab === 'facility') setActiveTab('clinical');
                      else if (activeTab === 'clinical') setActiveTab('vitals');
                      else if (activeTab === 'vitals') setActiveTab('ambulance');
                    }}
                  >
                    Next Section <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary">Create Referral</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED KISII COUNTY REFERRAL VIEW MODAL */}
      {selectedViewReferral && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '900px', width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header print:hidden">
              <h3 className="flex items-center gap-2"><FileText /> Kisii County Adult Referral Form</h3>
              <div className="flex gap-2">
                <button 
                  className="btn btn-outline btn-sm flex items-center gap-1"
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> Print Form
                </button>
                <button className="btn-close" onClick={() => setSelectedViewReferral(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body overflow-y-auto p-6" style={{ background: '#f9fafb' }}>
              
              {/* Paper Layout Mockup */}
              <div className="p-8 bg-white border border-gray-300 shadow-sm mx-auto" style={{ maxWidth: '800px', color: '#111', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}>
                
                {/* Kenya Crest / Kisii County Header */}
                <div className="text-center border-b-2 border-double border-gray-800 pb-4 mb-4">
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0' }}>REPUBLIC OF KENYA</h2>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '2px 0' }}>KISII COUNTY</h3>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: '2px 0' }}>DEPARTMENT OF HEALTH SERVICES</h4>
                  <div className="flex-between mt-3 font-bold" style={{ fontSize: '0.9rem' }}>
                    <span>Adult Referral Form</span>
                    <span className="text-red-600">Serial No. {selectedViewReferral.serial_no || '______'}</span>
                  </div>
                </div>

                {/* Facilities Info Row */}
                <table className="w-full border-collapse mb-4" style={{ border: '1px solid #000' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-2 w-1/2" style={{ borderRight: '1px solid #000' }}>
                        <strong>Referring Facility:</strong> {selectedViewReferral.referring_facility_name || 'N/A'}
                      </td>
                      <td className="p-2 w-1/2">
                        <strong>Contacts:</strong> {selectedViewReferral.referring_facility_contacts || 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-2 w-1/2" style={{ borderRight: '1px solid #000' }}>
                        <strong>MFL Code:</strong> {selectedViewReferral.referring_facility_mfl || 'N/A'}
                      </td>
                      <td className="p-2 w-1/2">
                        <strong>Receiving MFL Code:</strong> {selectedViewReferral.receiving_facility_mfl || 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-2 w-1/2" style={{ borderRight: '1px solid #000' }}>
                        <strong>Receiving Facility:</strong> {selectedViewReferral.destination_facility}
                      </td>
                      <td className="p-2 w-1/2">
                        <strong>Contacts:</strong> {selectedViewReferral.receiving_facility_contacts || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 w-1/2" style={{ borderRight: '1px solid #000' }}>
                        <strong>Referral Date:</strong> {formatDate(selectedViewReferral.referral_date)} <strong>Time:</strong> {selectedViewReferral.referral_time || 'N/A'}
                      </td>
                      <td className="p-2 w-1/2">
                        <strong>Date of Adm:</strong> {selectedViewReferral.admission_date ? formatDate(selectedViewReferral.admission_date) : 'N/A'} <strong>Time:</strong> {selectedViewReferral.admission_time || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Patient Profile */}
                <table className="w-full border-collapse mb-4" style={{ border: '1px solid #000' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-2 w-2/3" style={{ borderRight: '1px solid #000' }}>
                        <strong>Patient's Name:</strong> {selectedViewReferral.patient_name}
                      </td>
                      <td className="p-2 w-1/3">
                        <strong>IP/OP no.</strong> {selectedViewReferral.patient_ip_op_no || selectedViewReferral.patient_number}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-2" style={{ borderRight: '1px solid #000' }}>
                        <strong>Diagnosis:</strong> {selectedViewReferral.patient_diagnosis || 'N/A'}
                      </td>
                      <td className="p-2">
                        <strong>Age:</strong> {selectedViewReferral.patient_age || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Gender:</strong> {selectedViewReferral.patient_gender || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2" colSpan={2}>
                        <strong>Next of Kin Contacts:</strong> {selectedViewReferral.next_of_kin_contacts || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* History & Allergies */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="mb-2"><strong>History of Illness/Injury:</strong></div>
                  <div className="pl-3 mb-2 min-h-12" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.history_illness_injury || 'None recorded'}</div>
                  
                  <div className="mb-2"><strong>Medical/Surgical History:</strong></div>
                  <div className="pl-3 mb-2 min-h-12" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.medical_surgical_history || 'None recorded'}</div>
                  
                  <div className="mb-2"><strong>Allergies:</strong></div>
                  <div className="pl-3" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.allergies || 'None recorded'}</div>
                </div>

                {/* OBS/GYN History */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="font-bold border-b pb-1 mb-2">OBS / GYN HISTORY</div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div><strong>No. of ANC Visits:</strong> {selectedViewReferral.anc_visits_count ?? 'N/A'}</div>
                    <div><strong>Which Facility?</strong> {selectedViewReferral.anc_facility || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2 border-b pb-2">
                    <div><strong>TT Dose:</strong> {selectedViewReferral.tt_dose || 'N/A'}</div>
                    <div><strong>Para:</strong> {selectedViewReferral.para ?? 'N/A'}</div>
                    <div><strong>Gravida:</strong> {selectedViewReferral.gravida ?? 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-2 border-b pb-2">
                    <div><strong>HIV:</strong> {selectedViewReferral.hiv_status || 'N/A'}</div>
                    <div><strong>Syphilis:</strong> {selectedViewReferral.syphilis_status || 'N/A'}</div>
                    <div><strong>HB:</strong> {selectedViewReferral.hb_level ? `${selectedViewReferral.hb_level} g/dL` : 'N/A'}</div>
                    <div><strong>B/G:</strong> {selectedViewReferral.blood_group || 'N/A'}</div>
                    <div><strong>Rhesus:</strong> {selectedViewReferral.rhesus_factor || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-2 border-b pb-2">
                    <div><strong>Fundal Ht:</strong> {selectedViewReferral.fundal_height ? `${selectedViewReferral.fundal_height} cm` : 'N/A'}</div>
                    <div><strong>Lie:</strong> {selectedViewReferral.fetal_lie || 'N/A'}</div>
                    <div><strong>Presentation:</strong> {selectedViewReferral.fetal_presentation || 'N/A'}</div>
                    <div><strong>Position:</strong> {selectedViewReferral.fetal_position || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><strong>VE Cerv Dilat:</strong> {selectedViewReferral.cervical_dilatation || 'N/A'}</div>
                    <div><strong>Presenting Part:</strong> {selectedViewReferral.presenting_part || 'N/A'}</div>
                    <div><strong>Membranes:</strong> {selectedViewReferral.membranes_status || 'N/A'}</div>
                  </div>
                </div>

                {/* Observations Vitals */}
                <table className="w-full border-collapse mb-4" style={{ border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #000' }}>
                      <th className="p-1 border-r text-left" style={{ borderRight: '1px solid #000' }}>Observations / Vitals</th>
                      <th className="p-1 text-center">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>Fetal Heart Rate (bpm)</td>
                      <td className="p-1 text-center font-bold">{selectedViewReferral.fetal_heart_rate ?? 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>SpO₂ (%)</td>
                      <td className="p-1 text-center">{selectedViewReferral.spo2 ? `${selectedViewReferral.spo2}%` : 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>Pulse Rate (bpm)</td>
                      <td className="p-1 text-center">{selectedViewReferral.pulse_rate ?? 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>Breathing / Respiratory Rate (rpm)</td>
                      <td className="p-1 text-center">{selectedViewReferral.respiratory_rate ?? 'N/A'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>Blood Pressure</td>
                      <td className="p-1 text-center">{selectedViewReferral.blood_pressure || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r" style={{ borderRight: '1px solid #000' }}>Temperature</td>
                      <td className="p-1 text-center">{selectedViewReferral.temperature ? `${selectedViewReferral.temperature} °C` : 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Glasgow Coma Scale */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="font-bold border-b pb-1 mb-2">GLASGOW COMA SCALE (GCS)</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><strong>Eye:</strong> {selectedViewReferral.gcs_eye ?? 'N/A'}</div>
                    <div><strong>Motor:</strong> {selectedViewReferral.gcs_motor ?? 'N/A'}</div>
                    <div><strong>Verbal:</strong> {selectedViewReferral.gcs_verbal ?? 'N/A'}</div>
                    <div className="font-bold bg-gray-100 p-1" style={{ background: '#f3f4f6' }}>Total: {selectedViewReferral.gcs_score_total ?? 'N/A'} / 15</div>
                  </div>
                </div>

                {/* Assessment & Treatment */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="mb-2"><strong>Assessments / Investigations Done:</strong></div>
                  <div className="pl-3 mb-2 min-h-12" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.investigations_done || 'None'}</div>
                  
                  <div className="mb-2"><strong>Treatment / Interventions given:</strong></div>
                  <div className="pl-3" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.treatment_interventions || 'None'}</div>
                </div>

                {/* Ambulance Logs */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="font-bold border-b pb-1 mb-2">AMBULANCE TIMELOGS & DETAILS</div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div><strong>First Call:</strong> {selectedViewReferral.ambulance_first_call_time || 'N/A'}</div>
                    <div><strong>Call Received:</strong> {selectedViewReferral.ambulance_call_received_time || 'N/A'}</div>
                    <div><strong>Dispatched:</strong> {selectedViewReferral.ambulance_dispatched_time || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2 border-b pb-2">
                    <div><strong>Arrival Scene:</strong> {selectedViewReferral.ambulance_arrival_scene_time || 'N/A'}</div>
                    <div><strong>Departure Fac:</strong> {selectedViewReferral.ambulance_departure_facility_time || 'N/A'}</div>
                    <div><strong>Arrival Hosp:</strong> {selectedViewReferral.ambulance_arrival_hospital_time || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><strong>Transport Mode:</strong> {selectedViewReferral.transport_mode}</div>
                    <div><strong>Ambulance Reg:</strong> {selectedViewReferral.ambulance_reg_no || 'N/A'}</div>
                    <div><strong>Hosp Received:</strong> {selectedViewReferral.receiving_hospital || 'N/A'}</div>
                  </div>
                </div>

                {/* Call Details */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="font-bold border-b pb-1 mb-2">CALL DETAILS</div>
                  <div className="grid grid-cols-2 gap-4 border-b pb-2 mb-2">
                    <div>
                      <strong>Referral Called By:</strong> {selectedViewReferral.call_made_by || 'N/A'} <br/>
                      <strong>Designation:</strong> {selectedViewReferral.call_made_by_designation || 'N/A'} <br/>
                      <strong>Time:</strong> {selectedViewReferral.call_made_by_time || 'N/A'}
                    </div>
                    <div>
                      <strong>Call Received By:</strong> {selectedViewReferral.call_received_by || 'N/A'} <br/>
                      <strong>Designation:</strong> {selectedViewReferral.call_received_by_designation || 'N/A'} <br/>
                      <strong>Time:</strong> {selectedViewReferral.call_received_by_time || 'N/A'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Crew 1 Name:</strong> {selectedViewReferral.crew_1_name || 'N/A'} <br/>
                      <strong>Signature:</strong> {selectedViewReferral.crew_1_sign || 'N/A'}
                    </div>
                    <div>
                      <strong>Crew 2 Name:</strong> {selectedViewReferral.crew_2_name || 'N/A'} <br/>
                      <strong>Signature:</strong> {selectedViewReferral.crew_2_sign || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Handover & Reasons */}
                <div className="border p-2 mb-4" style={{ border: '1px solid #000' }}>
                  <div className="grid grid-cols-3 gap-2 mb-2 border-b pb-2">
                    <div><strong>Staff Handed Over:</strong> {selectedViewReferral.staff_handed_over || 'N/A'}</div>
                    <div><strong>Handover Date:</strong> {selectedViewReferral.handover_date ? formatDate(selectedViewReferral.handover_date) : 'N/A'}</div>
                    <div><strong>Handover Time:</strong> {selectedViewReferral.handover_time || 'N/A'}</div>
                  </div>
                  
                  <div className="mb-2"><strong>Reason for Referral:</strong></div>
                  <div className="pl-3 mb-2" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.reason}</div>

                  {selectedViewReferral.clinical_summary && (
                    <>
                      <div className="mb-2"><strong>Clinical Summary:</strong></div>
                      <div className="pl-3 mb-2" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.clinical_summary}</div>
                    </>
                  )}

                  {selectedViewReferral.comments && (
                    <>
                      <div className="mb-2"><strong>Comments:</strong></div>
                      <div className="pl-3" style={{ borderBottom: '1px dashed #ccc' }}>{selectedViewReferral.comments}</div>
                    </>
                  )}
                </div>

                {/* Printed Timestamp */}
                <div className="text-right text-xs text-gray-500 mt-4">
                  Generated digitally on {new Date().toLocaleString()} by MaterniTrack Referral Module.
                </div>
              </div>

            </div>

            <div className="modal-footer print:hidden">
              <button className="btn btn-ghost" onClick={() => setSelectedViewReferral(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE OUTCOME MODAL */}
      {isUpdateOpen && selectedReferral && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Update Referral Outcome</h3>
              <button className="btn-close" onClick={() => { setIsUpdateOpen(false); setSelectedReferral(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p>Outcome for <strong>{selectedReferral.patient_name}</strong> to <strong>{selectedReferral.destination_facility}</strong></p>

                <label className="flex items-center gap-2 mb-4 cursor-pointer" style={{ fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={feedbackReceived}
                    onChange={(e) => setFeedbackReceived(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Feedback received from destination facility
                </label>

                <label className="form-label mb-3">
                  Referral Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </label>

                <label className="form-label mb-3">
                  Outcome & Feedback Notes
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="Enter details about what happened at the destination hospital..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setIsUpdateOpen(false); setSelectedReferral(null); }}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
