import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  Info, 
  ClipboardList, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { remindersApi, patientsApi, appointmentsApi } from '../api';
import { ReminderLog, Patient, Appointment } from '../types';
import { formatDateTime, APPT_TYPE_LABELS } from '../utils';

export default function Reminders() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: '', appointment_id: '', use_template: true, message: '', lang: 'en' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Bulk SMS states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCohort, setBulkCohort] = useState('ALL');
  const [bulkForm, setBulkForm] = useState({ use_template: true, message: '', lang: 'en' });
  const [bulkResult, setBulkResult] = useState<{ success: boolean; msg: string; sent?: number; failed?: number } | null>(null);

  // Preview flow
  const [step, setStep] = useState<'compose' | 'preview'>('compose');
  const [preview, setPreview] = useState<{ message: string; length: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, pRes, aRes] = await Promise.all([
        remindersApi.list(),
        patientsApi.list(),
        appointmentsApi.list(),
      ]);
      setLogs(lRes.data.results ?? lRes.data);
      setPatients(pRes.data.results ?? pRes.data);
      setAppointments(aRes.data.results ?? aRes.data);
    } catch (err) {
      console.error('Reminders load error:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openModal = () => {
    setForm({ patient_id: '', appointment_id: '', use_template: true, message: '', lang: 'en' });
    setStep('compose');
    setPreview(null);
    setResult(null);
    setShowModal(true);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) return;
    setSending(true);
    setResult(null);
    try {
      const payload: any = { patient_id: +form.patient_id, use_template: form.use_template, lang: form.lang };
      if (form.appointment_id) payload.appointment_id = +form.appointment_id;
      if (!form.use_template && form.message) payload.message = form.message;

      const { data } = await remindersApi.preview(payload);
      setPreview({ message: data.message, length: data.length });
      setStep('preview');
    } catch (err: any) {
      setResult({ success: false, msg: 'Unable to generate message preview. Please ensure the patient is correctly selected, check your network connection, and try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    setSending(true); setResult(null);
    try {
      const payload: any = { patient_id: +form.patient_id, use_template: form.use_template, lang: form.lang };
      if (form.appointment_id) payload.appointment_id = +form.appointment_id;
      if (!form.use_template && form.message) payload.message = form.message;
      const { data } = await remindersApi.send(payload);
      if (data.success) {
        // Build detailed success feedback message based on which channels succeeded
        const logs = data.logs || [];
        const smsLog = logs.find((l: any) => l.channel === 'SMS');
        const emailLog = logs.find((l: any) => l.channel === 'EMAIL');
        
        let msg = 'Reminder sent successfully! ✓';
        if (smsLog && emailLog) {
          if (smsLog.delivery_status === 'SENT' && emailLog.delivery_status === 'SENT') {
            msg = 'SMS and Email reminders sent successfully! ✓';
          } else if (smsLog.delivery_status === 'SENT') {
            msg = 'SMS reminder sent successfully! ✓ (Email delivery failed)';
          } else if (emailLog.delivery_status === 'SENT') {
            msg = 'Email reminder sent successfully! ✓ (SMS delivery failed)';
          }
        } else if (smsLog && smsLog.delivery_status === 'SENT') {
          msg = 'SMS reminder sent successfully! ✓';
        } else if (emailLog && emailLog.delivery_status === 'SENT') {
          msg = 'Email reminder sent successfully! ✓';
        }

        setResult({ success: true, msg });
        setShowModal(false); load();
      } else {
        const errorDetail = data.error ? ` (${data.error})` : '';
        setResult({ success: false, msg: `Reminder delivery failed${errorDetail}. Please verify the customer's connection, check configurations, or try again.` });
      }
    } catch (err: any) {
      setResult({ success: false, msg: 'Failed to send SMS reminder. Please check your Africa\'s Talking configuration (API key and Username), verify that the patient has a valid phone number, and ensure you have internet access.' });
    } finally { setSending(false); }
  };

  const openBulkModal = () => {
    setBulkCohort('ALL');
    setBulkForm({ use_template: true, message: '', lang: 'en' });
    setBulkResult(null);
    setShowBulkModal(true);
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = filteredBulkPatients.map(p => p.id);
    if (ids.length === 0) return;
    setSending(true);
    setBulkResult(null);
    try {
      const payload: any = {
        patient_ids: ids,
        use_template: bulkForm.use_template,
        lang: bulkForm.lang
      };
      if (!bulkForm.use_template && bulkForm.message) {
        payload.message = bulkForm.message;
      }
      const { data } = await remindersApi.bulk(payload);
      if (data.queued) {
        setBulkResult({
          success: true,
          msg: `Bulk reminders queued successfully! (Task ID: ${data.task_id})`
        });
      } else {
        setBulkResult({
          success: true,
          msg: `Bulk reminders sent successfully!`,
          sent: data.sent,
          failed: data.failed
        });
        load();
      }
    } catch (err: any) {
      setBulkResult({ success: false, msg: 'Failed to dispatch bulk SMS reminders. Please check your SMS provider credentials in the environment setup, verify cohort selection, and try again.' });
    } finally {
      setSending(false);
    }
  };

  const getFilteredPatientsForBulk = () => {
    if (bulkCohort === 'ALL') {
      return patients;
    }
    if (['ANC1', 'ANC2', 'ANC3', 'ANC4', 'POSTNATAL'].includes(bulkCohort)) {
      return patients.filter(p => p.clinic_stage === bulkCohort);
    }
    if (bulkCohort === 'MISSED') {
      const missedPatientIds = new Set(appointments.filter(a => a.status === 'MISSED').map(a => a.patient));
      return patients.filter(p => missedPatientIds.has(p.id));
    }
    return [];
  };

  const filteredBulkPatients = getFilteredPatientsForBulk();
  const patientAppointments = appointments.filter(a => a.patient === +form.patient_id && a.status === 'UPCOMING');

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <MessageSquare className="text-primary" size={28} /> SMS Reminders
        </h1>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button id="bulk-reminder-btn" className="btn btn-secondary flex items-center gap-2" onClick={openBulkModal}>
            <Smartphone size={18} /> Bulk Remind
          </button>
          <button id="send-reminder-btn" className="btn btn-primary flex items-center gap-2" onClick={openModal}>
            <Send size={18} /> Send Reminder
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--warning-glow)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="text-warning"><Info size={24} /></span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--warning)' }}>Africa's Talking Integration</div>
              <div className="text-muted text-sm">Configure your API key in <code style={{ color: 'var(--primary)' }}>.env</code> (AT_API_KEY). Use sandbox mode for testing. Ensure the phone numbers are in international format (+254XXXXXXXXX).</div>
            </div>
          </div>
        </div>

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : (
          <div className="card">
            <header className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" /> Sent Reminders ({logs.length})
              </h2>
              <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={load}>
                <RefreshCw size={14} /> Refresh
              </button>
            </header>
            
            {logs.length === 0
              ? <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-icon"><MessageSquare size={48} className="text-muted" /></div>
                  <div className="empty-title">No reminders sent yet</div>
                  <div className="empty-desc">This section stores logs of all outgoing text message reminders sent to patients. To transmit a notification, click 'Send Reminder' or 'Send Bulk Reminders' above, choose your target patient/cohort, write or select a template, and send.</div>
                </div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Patient</th><th>Phone</th><th>Appointment</th>
                      <th>Sent At</th><th>Status</th><th>Provider</th>
                    </tr></thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.patient_name}</td>
                          <td className="text-muted">{l.phone_number}</td>
                          <td className="text-muted">{l.appointment_info ?? '—'}</td>
                          <td className="text-muted">{formatDateTime(l.sent_at)}</td>
                          <td>
                            <span className={`badge badge-${l.delivery_status === 'SENT' ? 'success' : l.delivery_status === 'FAILED' ? 'danger' : 'warning'} flex items-center gap-1 w-fit`}>
                              {l.delivery_status === 'SENT' ? <CheckCircle size={12} /> : l.delivery_status === 'FAILED' ? <AlertCircle size={12} /> : <Clock size={12} />}
                              {l.delivery_status}
                            </span>
                          </td>
                          <td className="text-muted text-sm">{l.provider.replace('_', "'s ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {step === 'compose' ? 'Send SMS Reminder' : 'Confirm SMS Details'}
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal">✕</button>
            </div>
            {result && (
              <div className={`alert alert-${result.success ? 'success' : 'danger'}`}>
                {result.success ? '✓' : '⚠️'} {result.msg}
              </div>
            )}

            {step === 'compose' ? (
              <form onSubmit={handlePreview}>
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={form.patient_id} 
                    onChange={e => {
                      const pId = e.target.value;
                      const selectedPatient = patients.find(p => String(p.id) === pId);
                      setForm(f => ({
                        ...f, 
                        patient_id: pId, 
                        appointment_id: '',
                        lang: selectedPatient?.lang || 'en'
                      }));
                    }}
                  >
                    <option value="">— Select Patient —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name} ({p.phone_number})</option>)}
                  </select>
                </div>
                {patientAppointments.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Link to Appointment (optional)</label>
                    <select className="form-select" value={form.appointment_id} onChange={e => setForm(f => ({...f, appointment_id: e.target.value}))}>
                      <option value="">— None —</option>
                      {patientAppointments.map(a => (
                        <option key={a.id} value={a.id}>{APPT_TYPE_LABELS[a.appointment_type]} on {a.scheduled_date}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.patient_id && (
                  <div className="form-group">
                    <label className="form-label">Message Language</label>
                    <select 
                      className="form-select" 
                      value={form.lang} 
                      onChange={e => setForm(f => ({...f, lang: e.target.value}))}
                    >
                      <option value="en">English (English)</option>
                      <option value="sw">Swahili (Kiswahili)</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input type="checkbox" checked={form.use_template} onChange={e => setForm(f => ({...f, use_template: e.target.checked}))} />
                    Use automatic message template
                  </label>
                </div>
                {!form.use_template && (
                  <div className="form-group">
                    <label className="form-label">Custom Message *</label>
                    <textarea className="form-textarea" rows={4} required={!form.use_template}
                      value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                      placeholder="Dear Jane, your appointment at Itierio Nursing Home…" />
                    <span className="form-hint">{form.message.length}/160 characters</span>
                  </div>
                )}
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Loading Preview…' : 'Continue to Preview'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Recipient Phone</label>
                  <input className="form-input" type="text" readOnly value={patients.find(p => String(p.id) === form.patient_id)?.phone_number || ''} />
                </div>
                <div className="form-group">
                  <label className="form-label">SMS Message Body</label>
                  <div className="alert alert-warning" style={{ color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.88rem', whiteSpace: 'pre-wrap', minHeight: 60 }}>
                    {preview?.message}
                  </div>
                  <span className="form-hint" style={{ fontWeight: 600, color: (preview?.length ?? 0) > 160 ? 'var(--danger)' : 'inherit' }}>
                    {preview?.length} / 160 characters ({(preview?.length ?? 0) > 0 ? Math.ceil((preview?.length ?? 0) / 160) : 0} segment{Math.ceil((preview?.length ?? 0) / 160) !== 1 ? 's' : ''})
                  </span>
                </div>

                {preview && preview.length > 160 && (
                  <div className="alert alert-danger" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <span>⚠️ SMS exceeds 160 characters (1 segment) and may cost extra.</span>
                  </div>
                )}

                <div className="modal-footer" style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep('compose')}>Edit Message</button>
                  <button id="confirm-send-btn" type="button" className="btn btn-primary flex items-center gap-1" onClick={handleSend} disabled={sending}>
                    {sending ? 'Sending…' : <><Send size={14} /> Confirm & Send</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBulkModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">Send Bulk SMS Reminders</div>
              <button className="modal-close" onClick={() => setShowBulkModal(false)} aria-label="Close modal">✕</button>
            </div>

            {bulkResult && (
              <div className={`alert alert-${bulkResult.success ? 'success' : 'danger'}`}>
                {bulkResult.success ? '✓' : '⚠️'} {bulkResult.msg}
                {bulkResult.sent !== undefined && (
                  <div style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                    Sent: <strong style={{ color: 'var(--success)' }}>{bulkResult.sent}</strong> | Failed: <strong style={{ color: 'var(--danger)' }}>{bulkResult.failed}</strong>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendBulk}>
              <div className="form-group">
                <label className="form-label">Target Cohort / Filter *</label>
                <select className="form-select" required value={bulkCohort} onChange={e => setBulkCohort(e.target.value)}>
                  <option value="ALL">All Active Patients</option>
                  <option value="ANC1">ANC Stage 1</option>
                  <option value="ANC2">ANC Stage 2</option>
                  <option value="ANC3">ANC Stage 3</option>
                  <option value="ANC4">ANC Stage 4</option>
                  <option value="POSTNATAL">Postnatal Patients</option>
                  <option value="MISSED">Patients with Missed Appointments</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message Language</label>
                <select className="form-select" value={bulkForm.lang} onChange={e => setBulkForm(f => ({ ...f, lang: e.target.value }))}>
                  <option value="en">English (English)</option>
                  <option value="sw">Swahili (Kiswahili)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input type="checkbox" checked={bulkForm.use_template} onChange={e => setBulkForm(f => ({ ...f, use_template: e.target.checked }))} />
                  Use automatic message template
                </label>
              </div>

              {!bulkForm.use_template && (
                <div className="form-group">
                  <label className="form-label">Custom Message *</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4} 
                    required={!bulkForm.use_template}
                    value={bulkForm.message} 
                    onChange={e => setBulkForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Enter the custom message to send to all selected recipients..." 
                  />
                  <span className="form-hint">{bulkForm.message.length}/160 characters</span>
                </div>
              )}

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  Recipients ({filteredBulkPatients.length})
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', background: 'var(--bg-card-header)' }}>
                  {filteredBulkPatients.length === 0 ? (
                    <div className="text-muted text-sm" style={{ padding: '8px', textAlign: 'center' }}>No matching patients found.</div>
                  ) : (
                    <table style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Name</th>
                          <th style={{ textAlign: 'left' }}>Phone</th>
                          <th style={{ textAlign: 'left' }}>Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBulkPatients.map(p => (
                          <tr key={p.id}>
                            <td>{p.full_name}</td>
                            <td className="text-muted">{p.phone_number}</td>
                            <td className="text-muted">{p.clinic_stage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {sending && filteredBulkPatients.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'flex', justifyContent: 'between' }}>
                    <span>Sending progress...</span>
                    <span>{filteredBulkPatients.length > 10 ? 'Processing asynchronously...' : 'Processing...'}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending || filteredBulkPatients.length === 0}>
                  {sending ? 'Sending Reminders...' : `Send to ${filteredBulkPatients.length} Patients`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
