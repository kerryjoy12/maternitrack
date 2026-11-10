import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  FileText, 
  Plus, 
  X, 
  CheckCircle,
  Clock,
  FlaskConical,
  Heart,
  Zap,
  Thermometer,
  User,
  ExternalLink,
  ChevronLeft,
  Check,
  TrendingUp,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react';
import { patientsApi, partographApi } from '../api';
import { Patient } from '../types';
import { formatDate, downloadBlob } from '../utils';
import PartographChart, { PartographDataPoint } from '../components/PartographChart';
import { useFormValidation, partographSchema, PartographFormFields } from '../hooks/useFormValidation';

// ─── Entry type from API ───────────────────────────────────────────────────────
interface PartographEntry {
  id: number;
  hours_in_labour: number;
  cervical_dilation_cm: string | null;
  fetal_heart_rate: number | null;
  contractions_per_10min: number | null;
  descent_station: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_rate: number | null;
  temperature_celsius: string | null;
  moulding: string;
  liquor: string;
  contraction_duration: string;
  urine_protein: string;
  drugs_given: string;
  notes: string;
  recorded_by_name: string | null;
  recorded_at: string;
}

const BLANK_FORM: PartographFormFields = {
  hours_in_labour: '',
  cervical_dilation_cm: '',
  fetal_heart_rate: '',
  contractions_per_10min: '',
  bp_systolic: '',
  bp_diastolic: '',
  pulse_rate: '',
  temperature_celsius: '',
  descent_station: '',
};

const EXTRA_BLANK = {
  moulding: '0',
  liquor: 'I',
  contraction_duration: '',
  urine_protein: 'NIL',
  drugs_given: '',
  notes: '',
};

export default function Partograph() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [entries, setEntries]   = useState<PartographEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm]   = useState<PartographFormFields>(BLANK_FORM);
  const [extra, setExtra] = useState(EXTRA_BLANK);

  const { getError, validateOne, validateAll, touch, reset } = useFormValidation(partographSchema);

  const load = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        patientsApi.get(patientId),
        partographApi.list(patientId),
      ]);
      setPatient(pRes.data);
      setEntries(eRes.data.results ?? eRes.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [patientId]);

  const handleExportPdf = async () => {
    try {
      const res = await partographApi.exportPdf(patientId);
      downloadBlob(res.data, `Partograph_${patient?.patient_number || 'Export'}.pdf`);
    } catch (err) {
      setApiError('Failed to export PDF. Please check your connection and try again.');
    }
  };

  const setF = (k: keyof PartographFormFields, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    validateOne(k, v, { ...form, [k]: v });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validateAll(form)) return;
    setSaving(true);
    try {
      await partographApi.create(patientId, {
        hours_in_labour:       parseFloat(form.hours_in_labour),
        cervical_dilation_cm:  form.cervical_dilation_cm  ? parseFloat(form.cervical_dilation_cm)  : null,
        fetal_heart_rate:      form.fetal_heart_rate      ? parseInt(form.fetal_heart_rate)         : null,
        contractions_per_10min:form.contractions_per_10min? parseInt(form.contractions_per_10min)   : null,
        descent_station:       form.descent_station       ? parseInt(form.descent_station)           : null,
        bp_systolic:           form.bp_systolic           ? parseInt(form.bp_systolic)               : null,
        bp_diastolic:          form.bp_diastolic          ? parseInt(form.bp_diastolic)              : null,
        pulse_rate:            form.pulse_rate            ? parseInt(form.pulse_rate)                : null,
        temperature_celsius:   form.temperature_celsius   ? parseFloat(form.temperature_celsius)    : null,
        ...extra,
      });
      setSuccessMsg('Observation recorded');
      setTimeout(() => setSuccessMsg(''), 3000);
      setForm(BLANK_FORM);
      setExtra(EXTRA_BLANK);
      reset();
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error('API Error:', err.response?.data || err.message);
      const backendError = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setApiError(`Unable to record labour observation. Backend error: ${backendError}`);
    } finally {
      setSaving(false);
    }
  };

  // Map entries to chart data
  const chartData: PartographDataPoint[] = entries.map(e => ({
    hours_in_labour:       Number(e.hours_in_labour),
    cervical_dilation_cm:  e.cervical_dilation_cm !== null ? parseFloat(e.cervical_dilation_cm) : null,
    fetal_heart_rate:      e.fetal_heart_rate,
    contractions_per_10min:e.contractions_per_10min,
    descent_station:       e.descent_station,
  }));

  const FieldError = ({ field }: { field: keyof PartographFormFields }) => {
    const err = getError(field);
    return err ? <span className="form-error">{err}</span> : null;
  };

  const ValidatedInput = ({
    field, label, type = 'number', placeholder = '', required = false,
  }: {
    field: keyof PartographFormFields;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      <input
        className={`form-input${getError(field) ? ' input-error' : ''}`}
        type={type}
        step="any"
        placeholder={placeholder}
        value={form[field]}
        required={required}
        onChange={e => setF(field, e.target.value)}
        onBlur={() => touch(field)}
      />
      <FieldError field={field} />
    </div>
  );

  if (loading) return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2"><Activity /> Partograph</h1>
      </header>
      <div className="page-body loading-wrap"><div className="spinner" /></div>
    </>
  );

  if (!patient) return (
    <div className="page-body flex items-center gap-2 text-danger">
      <X size={18} /> Patient not found.
    </div>
  );

  return (
    <>
      <header className="page-header">
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm flex items-center gap-1">
          <ChevronLeft size={16} /> Back
        </Link>
        <h1 className="flex items-center gap-2">
          <Activity className="text-primary" /> Partograph — {patient.full_name}
        </h1>
        <div className="header-actions">
          <span className="badge badge-primary">{patient.patient_number}</span>
          <button
            onClick={handleExportPdf}
            className="btn btn-ghost btn-sm flex items-center gap-1"
          >
            <FileText size={16} /> Export PDF
          </button>
          <button
            id="add-partograph-btn"
            className="btn btn-primary flex items-center gap-1"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Observation</>}
          </button>
        </div>
      </header>

      <div className="page-body">
        {successMsg && (
          <div className="alert alert-success flex items-center gap-2">
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        {/* ── Data entry form ────────────────────────────────────────────── */}
        {showForm && (
          <div className="card mb-6" style={{ borderLeft: '3px solid var(--hosp-teal)' }}>
            <div className="section-title flex items-center gap-2">
              <Activity size={20} className="text-primary" /> Record Labour Observation
            </div>
            {apiError && <div className="alert alert-danger">{apiError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="partograph-form-grid">

                {/* Column 1: Time + Cervimetry */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label flex items-center gap-2">
                    <Clock size={16} className="text-muted" /> Time
                  </div>
                  <ValidatedInput field="hours_in_labour" label="Hours in Labour" placeholder="0–24" required />

                  <div className="partograph-form-group-label flex items-center gap-2">
                    <FlaskConical size={16} className="text-muted" /> Cervimetry
                  </div>
                  <ValidatedInput field="cervical_dilation_cm" label="Cervical Dilation (cm)" placeholder="0–10" />
                  <ValidatedInput field="descent_station"      label="Station (-5 to +5)"    placeholder="e.g. -2" />

                  <div className="form-group">
                    <label className="form-label">Moulding</label>
                    <select className="form-select" value={extra.moulding}
                      onChange={e => setExtra(x => ({ ...x, moulding: e.target.value }))}>
                      <option value="0">None (0)</option>
                      <option value="1">+ (mild)</option>
                      <option value="2">++ (moderate)</option>
                      <option value="3">+++ (severe)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Liquor</label>
                    <select className="form-select" value={extra.liquor}
                      onChange={e => setExtra(x => ({ ...x, liquor: e.target.value }))}>
                      <option value="I">Intact</option>
                      <option value="C">Clear</option>
                      <option value="M">Meconium-stained</option>
                      <option value="B">Blood-stained</option>
                      <option value="A">Absent</option>
                    </select>
                  </div>
                </div>

                {/* Column 2: Fetal + Contractions */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label flex items-center gap-2">
                    <Heart size={16} className="text-muted" /> Fetal Parameters
                  </div>
                  <ValidatedInput field="fetal_heart_rate" label="Fetal Heart Rate (bpm)" placeholder="110–160" />

                  <div className="partograph-form-group-label flex items-center gap-2">
                    <Zap size={16} className="text-muted" /> Contractions
                  </div>
                  <ValidatedInput field="contractions_per_10min" label="Contractions / 10 min" placeholder="0–5" />
                  <div className="form-group">
                    <label className="form-label">Contraction Duration</label>
                    <select className="form-select" value={extra.contraction_duration}
                      onChange={e => setExtra(x => ({ ...x, contraction_duration: e.target.value }))}>
                      <option value="">— Select —</option>
                      <option value="<20">{'< 20 sec'}</option>
                      <option value="20-40">20–40 sec</option>
                      <option value=">40">{'> 40 sec'}</option>
                    </select>
                  </div>
                </div>

                {/* Column 3: Maternal */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label flex items-center gap-2">
                    <User size={16} className="text-muted" /> Maternal Vitals
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ValidatedInput field="bp_systolic"  label="BP Sys" placeholder="120" />
                    <ValidatedInput field="bp_diastolic" label="BP Dia" placeholder="80" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ValidatedInput field="pulse_rate"   label="Pulse"  placeholder="72" />
                    <div className="form-group">
                      <label className="form-label">Temp (°C)</label>
                      <input className="form-input" type="number" step="0.1" placeholder="36.5"
                        value={form.temperature_celsius}
                        onChange={e => setF('temperature_celsius', e.target.value)} />
                    </div>
                  </div>

                  <div className="partograph-form-group-label flex items-center gap-2">
                    <CheckCircle size={16} className="text-muted" /> Other
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urine Protein</label>
                    <select className="form-select" value={extra.urine_protein}
                      onChange={e => setExtra(x => ({ ...x, urine_protein: e.target.value }))}>
                      <option value="NIL">Nil</option>
                      <option value="TRACE">Trace</option>
                      <option value="+">+</option>
                      <option value="++">++</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Drugs & IV Fluids</label>
                <input className="form-input" value={extra.drugs_given}
                  onChange={e => setExtra(x => ({ ...x, drugs_given: e.target.value }))}
                  placeholder="Oxytocin, IV saline, etc." />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-textarea" style={{ minHeight: 60 }}
                  value={extra.notes}
                  onChange={e => setExtra(x => ({ ...x, notes: e.target.value }))}
                  placeholder="Record any significant observations or actions taken…" />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                  <CheckCircle size={18} /> {saving ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Chart & Table ──────────────────────────────────────────────── */}
        <PartographChart entries={chartData} />

        <div className="section-title mt-8 flex items-center gap-2">
          <Activity size={20} className="text-primary" /> Logged Observations
        </div>
        <div className="overflow-x-auto card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Time (hrs)</th>
                <th>Cervix</th>
                <th>Station</th>
                <th>FHR</th>
                <th>Contr.</th>
                <th>Mould.</th>
                <th>BP/Pulse</th>
                <th title="Temperature">Temp</th>
                <th>Recorded By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted">
                    <div style={{ fontWeight: 600 }}>No labour observations logged.</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 4, maxWidth: 500, margin: '4px auto 0' }}>
                      This log displays patient labour data points plotted on the WHO Partograph chart. Click 'Add Observation' above to document hours in labour, cervical dilation, descent, and fetal heart rate.
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map(e => (
                  <tr key={e.id}>
                    <td className="font-semibold text-primary">{e.hours_in_labour}h</td>
                    <td>{e.cervical_dilation_cm ?? '—'} cm</td>
                    <td>{e.descent_station ?? '—'}</td>
                    <td>{e.fetal_heart_rate ?? '—'}</td>
                    <td>{e.contractions_per_10min ?? '—'}</td>
                    <td>{e.moulding}</td>
                    <td className="text-sm">
                      {e.bp_systolic}/{e.bp_diastolic} · {e.pulse_rate}
                    </td>
                    <td>{e.temperature_celsius ? `${e.temperature_celsius}°C` : '—'}</td>
                    <td className="text-sm text-muted">{e.recorded_by_name}</td>
                    <td>
                       <Link to={`/partograph/entry/${e.id}/edit`} className="btn btn-ghost btn-sm p-1" title="Edit" aria-label="Edit observation">
                          <ExternalLink size={14} />
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
