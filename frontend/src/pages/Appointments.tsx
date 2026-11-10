import React, { useEffect, useState, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  Check, 
  X, 
  Clock,
  ChevronRight,
  Filter,
  ClipboardList,
  Download,
  FileText,
  Zap
} from 'lucide-react';
import { appointmentsApi, patientsApi, clinicalApi } from '../api';
import { Appointment, Patient, AppointmentStatus } from '../types';
import { formatDate, STATUS_COLORS, APPT_TYPE_LABELS } from '../utils';
import ANCVisitForm from './ANCVisitForm';
import { useRealtimeAppointments } from '../hooks/useRealtimeAppointments';

const STATUSES: { val: AppointmentStatus | ''; label: string }[] = [
  { val: '', label: 'All' }, { val: 'UPCOMING', label: 'Upcoming' },
  { val: 'ATTENDED', label: 'Attended' }, { val: 'MISSED', label: 'Missed' },
  { val: 'RESCHEDULED', label: 'Rescheduled' },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState<number | null>(null);
  const [showAttendForm, setShowAttendForm] = useState<number | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<number | null>(null);
  const [ancVisits, setAncVisits] = useState<{ [key: number]: number }>({}); // appointment_id -> anc_visit_id
  const [newDate, setNewDate] = useState('');
  const [form, setForm] = useState({ patient: '', appointment_type: 'ANC1', scheduled_date: '', scheduled_time: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');

  // Supabase Realtime — instant appointment change notifications
  const { hasUpdates, latestEvent, clearUpdates } = useRealtimeAppointments();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string,string> = {};
      if (statusFilter) params.status = statusFilter;
      const [aRes, pRes] = await Promise.all([
        appointmentsApi.list(params),
        patientsApi.list(),
      ]);
      const appts = aRes.data.results ?? aRes.data;
      setAppointments(appts);
      setPatients(pRes.data.results ?? pRes.data);
      
      // Load ANC visits to find which appointments have associated visits
      try {
        const ancRes = await clinicalApi.listAncVisits();
        const visits = ancRes.data.results ?? ancRes.data;
        const visitMap: { [key: number]: number } = {};
        visits.forEach((v: any) => {
          if (v.appointment) {
            visitMap[v.appointment] = v.id;
          }
        });
        setAncVisits(visitMap);
      } catch (e) {
        // Silently fail if can't load ANC visits
      }
    } catch (err) {
      setError('Unable to load appointments. Please check your connection, refresh the page, or contact system administration if the issue persists.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);
  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => { setActionMsg(msg); setError(''); setTimeout(() => setActionMsg(''), 3000); };

  const markAttended = (id: number) => {
    // For ANC appointments, show the ANC visit form
    const appointment = appointments.find(a => a.id === id);
    if (appointment && ['ANC1', 'ANC2', 'ANC3', 'ANC4'].includes(appointment.appointment_type)) {
      setShowAttendForm(id);
    } else {
      // For non-ANC appointments, just mark as attended
      markAttendedDirect(id);
    }
  };

  const markAttendedDirect = async (id: number) => {
    try {
      await appointmentsApi.markAttended(id);
      flash('Marked as attended ✓');
      load();
    } catch (err) {
      setError('Unable to mark appointment as attended. Please try again or verify that the patient record is active.');
    }
  };
  
  const downloadPDF = async (visitId: number, visitNumber: number) => {
    try {
      setDownloadingPDF(visitId);
      const response = await clinicalApi.getAncVisitPDF(visitId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ANC_Visit_${visitNumber}_ITIERIO.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(`/api/v1/clinical/anc-visits/${visitId}/pdf/`, '_blank');
    } finally {
      setDownloadingPDF(null);
    }
  };
  const markMissed = async (id: number) => {
    try {
      await appointmentsApi.markMissed(id);
      flash('Marked as missed');
      load();
    } catch (err) {
      setError('Unable to update appointment status. Please check your connection and try again.');
    }
  };
  const handleReschedule = async () => {
    if (!showReschedule || !newDate) return;
    try {
      await appointmentsApi.reschedule(showReschedule, { scheduled_date: newDate });
      setShowReschedule(null);
      flash('Rescheduled ✓');
      load();
    } catch (err) {
      setError('Failed to reschedule. Please select a valid future date and ensure the server is online.');
    }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await appointmentsApi.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      setError('Failed to schedule new appointment. Please verify patient availability and ensure the selected date is valid.');
    } finally {
      setSaving(false);
    }
  };

  const handleRealtimeRefresh = () => {
    load();
    clearUpdates();
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <Calendar className="text-primary" size={28} /> Appointments
        </h1>
        <div className="header-actions">
          <button id="new-appointment-btn" className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* Realtime update banner — appears when backend pushes appointment changes */}
        {hasUpdates && latestEvent && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 16px',
              marginBottom: 12,
              background: 'var(--primary-muted, rgba(79,70,229,0.08))',
              border: '1px solid var(--primary)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--primary)',
              fontWeight: 500,
            }}
          >
            <span className="flex items-center gap-2">
              <Zap size={14} />
              Live update: Appointment #{latestEvent.appointment_id} changed to{' '}
              <strong>{latestEvent.new_status}</strong>
            </span>
            <button
              id="realtime-refresh-btn"
              className="btn btn-sm"
              style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}
              onClick={handleRealtimeRefresh}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-4 flex items-center justify-between gap-2">
            <span>⚠️ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {actionMsg && <div className="alert alert-success flex items-center gap-2">
          <Check size={16} /> {actionMsg}
        </div>}

        <div className="filter-bar flex items-center gap-2">
          {STATUSES.map(s => (
            <button
              key={s.val}
              className={`btn ${statusFilter === s.val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setStatusFilter(s.val)}
            >{s.label}</button>
          ))}
          <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginLeft: 'auto' }} onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Calendar size={48} /></div>
              <div className="empty-title">No appointments found</div>
              <div className="empty-desc">This section manages upcoming and past clinical checkups. Use the 'New Appointment' button at the top right to schedule a new ANC or postnatal visit.</div>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 769px) */}
              <div className="table-wrap desktop-table-only">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th><th>Type</th><th>Date</th><th>Time</th>
                      <th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                          <div className="text-muted text-sm">{a.patient_number}</div>
                        </td>
                        <td>{APPT_TYPE_LABELS[a.appointment_type]}</td>
                        <td>{formatDate(a.scheduled_date)}</td>
                        <td className="text-muted">{a.scheduled_time ?? '—'}</td>
                        <td><span className={`badge badge-${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {a.status === 'UPCOMING' && (
                              <>
                                <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => markAttended(a.id)}>
                                  <Check size={14} /> Attend
                                </button>
                                <button className="btn btn-danger btn-sm flex items-center gap-1" onClick={() => markMissed(a.id)}>
                                  <X size={14} /> Miss
                                </button>
                                <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => { setShowReschedule(a.id); setNewDate(a.scheduled_date); }}>
                                  <Clock size={14} /> Reschedule
                                </button>
                              </>
                            )}
                            {a.status === 'ATTENDED' && ['ANC1', 'ANC2', 'ANC3', 'ANC4'].includes(a.appointment_type) && ancVisits[a.id] && (
                              <button 
                                className="btn btn-ghost btn-sm flex items-center gap-1" 
                                onClick={() => downloadPDF(ancVisits[a.id], parseInt(a.appointment_type.replace('ANC', '')))}
                                disabled={downloadingPDF === ancVisits[a.id]}
                              >
                                {downloadingPDF === ancVisits[a.id] ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Download size={14} /> PDF Report
                                  </>
                                )}
                              </button>
                            )}
                            {a.status === 'MISSED' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => { setShowReschedule(a.id); setNewDate(''); }}>📆 Reschedule</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Appointment Cards View (< 769px) */}
              <div className="mobile-cards-only mobile-card-grid">
                {appointments.map(a => (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{a.patient_number}</span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                          {a.patient_name}
                        </h3>
                      </div>
                      <span className={`badge badge-${STATUS_COLORS[a.status]}`}>{a.status}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.84rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Type</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{APPT_TYPE_LABELS[a.appointment_type]}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scheduled</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatDate(a.scheduled_date)} {a.scheduled_time ? `(${a.scheduled_time})` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {a.status === 'UPCOMING' && (
                        <>
                          <button className="btn btn-success btn-sm flex-1 flex items-center justify-center gap-1" onClick={() => markAttended(a.id)}>
                            <Check size={14} /> Attend
                          </button>
                          <button className="btn btn-danger btn-sm flex items-center justify-center gap-1" onClick={() => markMissed(a.id)}>
                            <X size={14} /> Miss
                          </button>
                          <button className="btn btn-ghost btn-sm flex items-center justify-center gap-1" onClick={() => { setShowReschedule(a.id); setNewDate(a.scheduled_date); }}>
                            <Clock size={14} />
                          </button>
                        </>
                      )}
                      {a.status === 'ATTENDED' && ['ANC1', 'ANC2', 'ANC3', 'ANC4'].includes(a.appointment_type) && ancVisits[a.id] && (
                        <button 
                          className="btn btn-ghost btn-sm w-full flex items-center justify-center gap-1" 
                          onClick={() => downloadPDF(ancVisits[a.id], parseInt(a.appointment_type.replace('ANC', '')))}
                          disabled={downloadingPDF === ancVisits[a.id]}
                        >
                          <Download size={14} /> Download Visit PDF
                        </button>
                      )}
                      {a.status === 'MISSED' && (
                        <button className="btn btn-ghost btn-sm w-full" onClick={() => { setShowReschedule(a.id); setNewDate(''); }}>
                          📆 Reschedule Appointment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Floating Action Button on Mobile */}
        <button 
          className="fab-btn"
          onClick={() => setShowModal(true)}
          aria-label="New Appointment"
          title="New Appointment"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Schedule Appointment</div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-select" required value={form.patient} onChange={e => setForm(f => ({...f, patient: e.target.value}))}>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Appointment Type *</label>
                <select className="form-select" value={form.appointment_type} onChange={e => setForm(f => ({...f, appointment_type: e.target.value}))}>
                  {Object.entries(APPT_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" required value={form.scheduled_date} onChange={e => setForm(f => ({...f, scheduled_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" value={form.scheduled_time} onChange={e => setForm(f => ({...f, scheduled_time: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="save-appointment-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : '✓ Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReschedule(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Reschedule Appointment</div>
              <button className="modal-close" onClick={() => setShowReschedule(null)} aria-label="Close modal">✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">New Date *</label>
              <input className="form-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReschedule(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReschedule}>✓ Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {/* ANC Visit Form Modal */}
      {showAttendForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAttendForm(null)}>
          <div className="modal" style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title flex items-center gap-2">
                <ClipboardList size={20} />
                ANC Visit Record
              </div>
              <button className="modal-close" onClick={() => { setShowAttendForm(null); load(); }} aria-label="Close modal">✕</button>
            </div>
            <div className="alert alert-info mb-4 flex items-center gap-2">
              <ClipboardList size={16} />
              <span>Please fill in the clinical findings for this ANC visit. All required fields must be completed.</span>
            </div>
            <ANCVisitForm 
              appointmentId={showAttendForm}
              onSuccess={() => {
                setShowAttendForm(null);
                flash('ANC visit recorded successfully ✓');
                load();
              }}
              onClose={() => { setShowAttendForm(null); load(); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
