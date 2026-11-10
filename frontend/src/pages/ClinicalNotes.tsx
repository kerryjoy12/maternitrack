import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  RefreshCw, 
  Stethoscope, 
  FlaskConical, 
  BarChart2, 
  Pill, 
  Share2, 
  Eye, 
  ClipboardCheck,
  User,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X,
  CheckCircle,
  Filter,
  Check
} from 'lucide-react';
import { clinicalApi, patientsApi } from '../api';
import { formatDate } from '../utils';

interface ClinicalNote {
  id: number;
  patient: number;
  patient_name: string;
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  title: string;
  content: string;
  diagnosis_codes: string;
  lab_test_name: string;
  lab_result_value: string;
  lab_result_unit: string;
  lab_is_abnormal: boolean;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  created_by_name: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  CONSULTATION: <Stethoscope size={16} />,
  LAB_ORDER: <FlaskConical size={16} />,
  LAB_RESULT: <BarChart2 size={16} />,
  PRESCRIPTION: <Pill size={16} />,
  REFERRAL: <Share2 size={16} />,
  OBSERVATION: <Eye size={16} />,
  DISCHARGE: <ClipboardCheck size={16} />,
};

const PRIORITY_COLORS: Record<string, string> = {
  ROUTINE: 'success',
  URGENT: 'warning',
  STAT: 'danger',
};

const CATEGORIES = [
  'CONSULTATION', 'LAB_ORDER', 'LAB_RESULT',
  'PRESCRIPTION', 'REFERRAL', 'OBSERVATION', 'DISCHARGE',
];

export default function ClinicalNotes() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    patient: patientId || '',
    category: 'CONSULTATION',
    priority: 'ROUTINE',
    title: '',
    content: '',
    diagnosis_codes: '',
    lab_test_name: '',
    lab_result_value: '',
    lab_result_unit: '',
    lab_is_abnormal: false,
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (patientId) params.patient = patientId;
      if (catFilter) params.category = catFilter;
      const [nRes, pRes] = await Promise.all([
        clinicalApi.listNotes(params),
        patientsApi.list(),
      ]);
      setNotes(nRes.data.results ?? nRes.data);
      setPatients((pRes.data.results ?? pRes.data));
    } catch (err) {
      console.error('ClinicalNotes load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId, catFilter]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicalApi.createNote(form);
      setShowForm(false);
      flash('Clinical note saved ✓');
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <FileText className="text-primary" size={28} /> Clinical Notes
        </h1>
        <div className="header-actions">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Close' : 'Add Note'}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && <div className="alert alert-success flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>}

        {/* Filters */}
        <div className="filter-bar flex items-center gap-2">
          <Filter size={18} className="text-muted" />
          <select className="form-select" style={{ width: '100%', maxWidth: 180, minWidth: 0 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginLeft: 'auto' }} onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6" style={{ borderLeft: '3px solid var(--hosp-teal)' }}>
            <div className="section-title flex items-center gap-2">
              <FileText size={18} className="text-primary" /> New Clinical Note
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patient} onChange={e => set('patient', e.target.value)} required>
                    <option value="">Select patient…</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Initial consultation, CBC results" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-textarea" rows={4} value={form.content} onChange={e => set('content', e.target.value)} required placeholder="Clinical findings, observations, instructions…" />
              </div>

              <div className="form-group">
                <label className="form-label">ICD-10 Diagnosis Codes</label>
                <input className="form-input" value={form.diagnosis_codes} onChange={e => set('diagnosis_codes', e.target.value)} placeholder="e.g. O14.1, O24.4" />
              </div>

              {/* Lab fields */}
              {(form.category === 'LAB_ORDER' || form.category === 'LAB_RESULT') && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Lab Test Name</label>
                    <input className="form-input" value={form.lab_test_name} onChange={e => set('lab_test_name', e.target.value)} placeholder="e.g. CBC, Urinalysis" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Result Value</label>
                    <input className="form-input" value={form.lab_result_value} onChange={e => set('lab_result_value', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input className="form-input" value={form.lab_result_unit} onChange={e => set('lab_result_unit', e.target.value)} placeholder="e.g. g/dL, mmol/L" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                    <input type="checkbox" checked={form.lab_is_abnormal} onChange={e => set('lab_is_abnormal', e.target.checked)} />
                    <label className="form-label" style={{ margin: 0, color: form.lab_is_abnormal ? 'var(--danger)' : undefined }}>
                      Abnormal Result
                    </label>
                  </div>
                </div>
              )}

              {/* Prescription fields */}
              {form.category === 'PRESCRIPTION' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Medication Name</label>
                    <input className="form-input" value={form.medication_name} onChange={e => set('medication_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosage</label>
                    <input className="form-input" value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <input className="form-input" value={form.frequency} onChange={e => set('frequency', e.target.value)} placeholder="e.g. TDS (3x daily)" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input className="form-input" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 7 days" />
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ paddingTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                  {saving ? 'Saving…' : <><Check size={18} /> Save Note</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={48} /></div>
            <div className="empty-title">No clinical notes yet</div>
            <div className="empty-desc">Add consultation notes, lab orders, or prescriptions.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notes.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: `4px solid var(--${PRIORITY_COLORS[n.priority] || 'primary'})` }}>
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="text-primary-600">{CATEGORY_ICONS[n.category] || <FileText size={16} />}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <div className="text-muted text-sm flex items-center gap-1 flex-wrap">
                        <User size={12} /> {n.patient_name} · {n.category_display} · {formatDate(n.created_at)}
                        {n.created_by_name && ` · by ${n.created_by_name}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge badge-${PRIORITY_COLORS[n.priority]}`}>{n.priority_display}</span>
                    {n.lab_is_abnormal && <span className="badge badge-danger flex items-center gap-1"><AlertTriangle size={12} /> Abnormal</span>}
                  </div>
                </div>
                <div className="divider" />
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.6 }}>{n.content}</p>

                {n.diagnosis_codes && (
                  <div className="text-muted text-sm flex items-center gap-1" style={{ marginTop: 8 }}>
                    <Search size={12} /> <strong>ICD-10:</strong> {n.diagnosis_codes}
                  </div>
                )}
                {n.lab_test_name && (
                  <div className="text-sm" style={{ marginTop: 6 }}>
                    <strong>Lab:</strong> {n.lab_test_name}
                    {n.lab_result_value && ` — ${n.lab_result_value} ${n.lab_result_unit}`}
                  </div>
                )}
                {n.medication_name && (
                  <div className="text-sm" style={{ marginTop: 6 }}>
                    <strong>Rx:</strong> {n.medication_name} {n.dosage} · {n.frequency} · {n.duration}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
