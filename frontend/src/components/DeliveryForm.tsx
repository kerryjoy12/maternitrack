import React, { useState } from 'react';
import { 
  Building2, 
  Baby, 
  Calendar, 
  Check, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  X,
  Dna,
  AlertTriangle
} from 'lucide-react';
import { postnatalApi } from '../api';
import { Patient } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NewbornRecord {
  baby_first_name: string;
  baby_last_name: string;
  baby_gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  baby_weight_kg: string;
  baby_condition: string;
  bcg_given: boolean;
  opv0_given: boolean;
  hep_b_given: boolean;
  apgar_score: string;
  notes: string;
}

interface DeliveryFormData {
  // Step 1 — Patient & Delivery
  patient: string;
  delivery_date: string;
  delivery_type: 'NORMAL' | 'CAESAREAN' | 'ASSISTED';
  mother_condition: string;
  notes: string;
  // Step 2 — Newborn(s) (dynamic sub-form)
  newborns: NewbornRecord[];
  // Step 3 — Review schedule
  review_7day_date: string;
  review_6week_date: string;
}

const BLANK_NEWBORN: NewbornRecord = {
  baby_first_name: '',
  baby_last_name: '',
  baby_gender: 'UNKNOWN',
  baby_weight_kg: '',
  baby_condition: '',
  bcg_given: false,
  opv0_given: false,
  hep_b_given: false,
  apgar_score: '',
  notes: '',
};

const getDefaultReviewDates = (deliveryDate: string) => {
  if (!deliveryDate) return { r7: '', r6w: '' };
  const base = new Date(deliveryDate);
  const r7  = new Date(base); r7.setDate(r7.getDate() + 7);
  const r6w = new Date(base); r6w.setDate(r6w.getDate() + 42);
  return {
    r7:  r7.toISOString().split('T')[0],
    r6w: r6w.toISOString().split('T')[0],
  };
};

// ─── Step indicators ───────────────────────────────────────────────────────────

const STEPS = [
  { icon: Building2, title: 'Delivery Details' },
  { icon: Baby, title: 'Newborn Record(s)' },
  { icon: Calendar, title: 'Follow-Up Schedule' },
];

interface StepBarProps { current: number }
function StepBar({ current }: StepBarProps) {
  return (
    <div className="mstep-bar">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className={`mstep-item ${i === current ? 'active' : i < current ? 'done' : ''}`}>
            <div className="mstep-circle">
              {i < current ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </div>
            <span className="mstep-label">{s.title}</span>
            {i < STEPS.length - 1 && <div className="mstep-line" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface DeliveryFormProps {
  patients: Patient[];
  initialData?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function DeliveryForm({ patients, initialData, onClose, onSaved }: DeliveryFormProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<DeliveryFormData>(() => {
    if (initialData) {
      return {
        patient: initialData.patient?.toString() || '',
        delivery_date: initialData.delivery_date || '',
        delivery_type: initialData.delivery_type || 'NORMAL',
        mother_condition: initialData.mother_condition || '',
        notes: initialData.notes || '',
        newborns: [{
          baby_first_name: initialData.baby_first_name || '',
          baby_last_name: initialData.baby_last_name || '',
          baby_gender: initialData.baby_gender || 'UNKNOWN',
          baby_weight_kg: initialData.baby_weight_kg ? String(initialData.baby_weight_kg) : '',
          baby_condition: initialData.baby_condition || '',
          bcg_given: !!initialData.bcg_given,
          opv0_given: !!initialData.opv0_given,
          hep_b_given: !!initialData.hep_b_given,
          apgar_score: initialData.apgar_score || '',
          notes: '',
        }],
        review_7day_date: initialData.review_7day_date || '',
        review_6week_date: initialData.review_6week_date || '',
      };
    }
    return {
      patient: '',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_type: 'NORMAL',
      mother_condition: '',
      notes: '',
      newborns: [{ ...BLANK_NEWBORN }],
      review_7day_date: '',
      review_6week_date: '',
    };
  });

  // Helpers
  const setField = <K extends keyof DeliveryFormData>(key: K, val: DeliveryFormData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const setNewborn = (idx: number, field: keyof NewbornRecord, val: string | boolean) =>
    setForm(f => {
      const nb = [...f.newborns];
      nb[idx] = { ...nb[idx], [field]: val };
      return { ...f, newborns: nb };
    });

  const addNewborn  = () => setForm(f => ({ ...f, newborns: [...f.newborns, { ...BLANK_NEWBORN }] }));
  const dropNewborn = (idx: number) =>
    setForm(f => ({ ...f, newborns: f.newborns.filter((_, i) => i !== idx) }));

  // When delivery date changes, auto-fill review dates
  const handleDeliveryDateChange = (val: string) => {
    const { r7, r6w } = getDefaultReviewDates(val);
    setForm(f => ({ ...f, delivery_date: val, review_7day_date: r7, review_6week_date: r6w }));
  };

  // Navigation
  const next = () => { setError(''); setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  // Validation per step
  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.patient)       { setError('Please select a patient.'); return false; }
      if (!form.delivery_date) { setError('Delivery date is required.'); return false; }
    }
    if (step === 1) {
      for (let i = 0; i < form.newborns.length; i++) {
        const nb = form.newborns[i];
        if (!nb.baby_condition) {
          setError(`Baby ${i + 1}: condition is required.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) next(); };

  // Submit — create delivery record then newborn records
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSaving(true); setError('');
    try {
      // Map to the first newborn fields that the existing API expects
      // (additional newborns stored in notes for now — extend as API grows)
      const firstNb = form.newborns[0];
      const extraNbJson = form.newborns.length > 1
        ? '\n\n[Additional newborns: ' + JSON.stringify(form.newborns.slice(1)) + ']'
        : '';

      const payload = {
        patient:            form.patient,
        delivery_date:      form.delivery_date,
        delivery_type:      form.delivery_type,
        mother_condition:   form.mother_condition,
        baby_first_name:    firstNb.baby_first_name,
        baby_last_name:     firstNb.baby_last_name,
        baby_gender:        firstNb.baby_gender,
        baby_weight_kg:     firstNb.baby_weight_kg || null,
        baby_condition:     firstNb.baby_condition,
        bcg_given:          firstNb.bcg_given,
        opv0_given:         firstNb.opv0_given,
        hep_b_given:        firstNb.hep_b_given,
        review_7day_date:   form.review_7day_date || null,
        review_6week_date:  form.review_6week_date || null,
        notes: (form.notes + extraNbJson).trim(),
      };

      if (initialData?.id) {
        await postnatalApi.update(initialData.id, payload);
      } else {
        await postnatalApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save delivery record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title flex items-center gap-2">
            <Baby size={20} className="text-primary" /> {initialData ? 'Edit Delivery Record' : 'Record Delivery'}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <StepBar current={step} />

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertTriangle size={18} className="mr-2 inline" /> {error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Step 0: Delivery Details ───────────────────────────── */}
          {step === 0 && (
            <div className="mstep-content">
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-select" required value={form.patient}
                  onChange={e => setField('patient', e.target.value)}>
                  <option value="">— Select delivered patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patient_number} — {p.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Delivery Date *</label>
                  <input className="form-input" type="date" required
                    value={form.delivery_date}
                    onChange={e => handleDeliveryDateChange(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Type *</label>
                  <select className="form-select" value={form.delivery_type}
                    onChange={e => setField('delivery_type', e.target.value as DeliveryFormData['delivery_type'])}>
                    <option value="NORMAL">Normal / Vaginal</option>
                    <option value="CAESAREAN">Caesarean Section</option>
                    <option value="ASSISTED">Assisted Delivery</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mother's Condition</label>
                  <input className="form-input" value={form.mother_condition} placeholder="e.g. Stable, Good"
                    onChange={e => setField('mother_condition', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Notes</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Any complications, medications, observations…" />
              </div>
            </div>
          )}

          {/* ── Step 1: Newborn Records (dynamic) ─────────────────── */}
          {step === 1 && (
            <div className="mstep-content">
              <div className="mstep-section-label flex items-center gap-2">
                <Baby size={18} /> Newborn Information
                <span className="mstep-count">{form.newborns.length} baby{form.newborns.length > 1 ? 'ies' : ''}</span>
              </div>

              {form.newborns.map((nb, idx) => (
                <div key={idx} className="newborn-block">
                  <div className="newborn-block__header">
                    <span className="newborn-block__title">
                      Baby {form.newborns.length > 1 ? `#${idx + 1}` : ''}
                    </span>
                    {form.newborns.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm flex items-center gap-1"
                        onClick={() => dropNewborn(idx)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" placeholder="First Name (Optional)"
                        value={nb.baby_first_name}
                        onChange={e => setNewborn(idx, 'baby_first_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" placeholder="Last Name (Optional)"
                        value={nb.baby_last_name}
                        onChange={e => setNewborn(idx, 'baby_last_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-select" value={nb.baby_gender}
                        onChange={e => setNewborn(idx, 'baby_gender', e.target.value)}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="UNKNOWN">Unknown</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (kg)</label>
                      <input className="form-input" type="number" step="0.01" placeholder="3.20"
                        value={nb.baby_weight_kg}
                        onChange={e => setNewborn(idx, 'baby_weight_kg', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">APGAR Score <span className="form-hint">(0–10)</span></label>
                      <input className="form-input" type="number" min="0" max="10" placeholder="8"
                        value={nb.apgar_score}
                        onChange={e => setNewborn(idx, 'apgar_score', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Baby's Condition *</label>
                      <input className="form-input" required placeholder="e.g. Healthy, Stable"
                        value={nb.baby_condition}
                        onChange={e => setNewborn(idx, 'baby_condition', e.target.value)} />
                    </div>
                  </div>

                  {/* Immunisations */}
                  <div className="newborn-block__immu-label">Immunisations Given</div>
                  <div className="newborn-block__immu-row">
                    {([['bcg_given', 'BCG'], ['opv0_given', 'OPV-0'], ['hep_b_given', 'Hep B']] as const).map(
                      ([key, label]) => (
                        <label key={key} className={`immu-toggle ${nb[key] ? 'immu-toggle--active' : ''}`}>
                          <input type="checkbox" checked={nb[key]}
                            onChange={e => setNewborn(idx, key, e.target.checked)} />
                          <span className="flex items-center gap-1">
                            {nb[key] ? <Check size={14} /> : <div style={{ width: 14, height: 14, border: '1px solid currentColor', borderRadius: 2 }} />} {label}
                          </span>
                        </label>
                      )
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">Notes for Baby {idx + 1}</label>
                    <textarea className="form-textarea" style={{ minHeight: 56 }}
                      value={nb.notes}
                      onChange={e => setNewborn(idx, 'notes', e.target.value)}
                      placeholder="Any observations…" />
                  </div>
                </div>
              ))}

              {/* Add another baby button */}
              <button type="button" className="btn btn-ghost flex items-center justify-center gap-2" style={{ width: '100%', marginTop: 8 }}
                onClick={addNewborn}>
                <Plus size={18} /> Add Another Baby (twins / multiples)
              </button>
            </div>
          )}

          {/* ── Step 2: Follow-Up Schedule ────────────────────────── */}
          {step === 2 && (
            <div className="mstep-content">
              <div className="mstep-section-label flex items-center gap-2">
                <Calendar size={18} /> Postnatal Review Dates
              </div>
              <p className="form-hint" style={{ marginBottom: 16 }}>
                Dates have been auto-calculated from the delivery date. Adjust if needed.
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">7-Day Review Date</label>
                  <input className="form-input" type="date"
                    value={form.review_7day_date}
                    onChange={e => setField('review_7day_date', e.target.value)} />
                  <span className="form-hint">Recommended: 7 days after delivery</span>
                </div>
                <div className="form-group">
                  <label className="form-label">6-Week Review Date</label>
                  <input className="form-input" type="date"
                    value={form.review_6week_date}
                    onChange={e => setField('review_6week_date', e.target.value)} />
                  <span className="form-hint">Recommended: 6 weeks (42 days) after delivery</span>
                </div>
              </div>

              {/* Summary */}
              <div className="delivery-summary">
                <div className="delivery-summary__title flex items-center gap-2">
                  <Dna size={18} className="text-primary" /> Delivery Summary
                </div>
                <div className="delivery-summary__grid">
                  <div><span>Patient</span><strong>{patients.find(p => String(p.id) === form.patient)?.full_name ?? '—'}</strong></div>
                  <div><span>Date</span><strong>{form.delivery_date}</strong></div>
                  <div><span>Type</span><strong>{form.delivery_type}</strong></div>
                  <div><span>Babies</span><strong>{form.newborns.length}</strong></div>
                  <div><span>Mother</span><strong>{form.mother_condition || '—'}</strong></div>
                  <div>
                    <span>Baby Genders</span>
                    <strong>{form.newborns.map(nb => nb.baby_gender[0]).join(', ')}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer navigation */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost flex items-center gap-1" onClick={step === 0 ? onClose : back}>
              {step === 0 ? <X size={18} /> : <ChevronLeft size={18} />}
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="mstep-progress-text">Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn btn-primary flex items-center gap-1" onClick={handleNext}>
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button id="save-delivery-btn" type="submit" className="btn btn-primary flex items-center gap-1" disabled={saving}>
                  {saving ? 'Saving…' : <><Save size={18} /> Save Delivery Record</>}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
