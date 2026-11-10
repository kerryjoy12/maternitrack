import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Activity,
  HeartPulse,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Hourglass,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motherApi } from '../api';
import { Appointment } from '../types';
import { extractListData, formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';
import { useRealtimeAppointments } from '../hooks/useRealtimeAppointments';

export default function MotherAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ONGOING' | 'PENDING' | 'FINISHED'>('ONGOING');
  
  // Rescheduling Modal State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Live appointment updates from Supabase Realtime
  const { hasUpdates, latestEvent, clearUpdates } = useRealtimeAppointments();

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await motherApi.appointments();
      setAppointments(extractListData<Appointment>(res.data));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeRefresh = () => {
    loadAppointments();
    clearUpdates();
  };

  useEffect(() => {
    loadAppointments();
  }, []);


  const getStatusGroup = (appt: Appointment) => {
    if (appt.status === 'UPCOMING') return 'ONGOING';
    if (appt.status === 'RESCHEDULED') return 'PENDING';
    return 'FINISHED';
  };

  const filteredAppointments = appointments.filter(appt => getStatusGroup(appt) === activeTab);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !newDate) return;

    try {
      setSubmitting(true);
      setError('');
      await motherApi.rescheduleAppointment(selectedAppt.id, newDate, newTime || null, reason);
      setSubmitSuccess('Reschedule request submitted successfully.');
      setTimeout(() => {
        setSelectedAppt(null);
        setSubmitSuccess('');
        setNewDate('');
        setNewTime('');
        setReason('');
        loadAppointments();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit reschedule request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  const formatReferenceDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const year = date.getFullYear();
      return `${day} ${weekday} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getAppointmentIcon = (appointmentType: string) => {
    switch (appointmentType) {
      case 'ANC1':
      case 'ANC2':
      case 'ANC3':
      case 'ANC4':
        return <HeartPulse className="text-primary" size={40} />;
      case 'POSTNATAL_7DAY':
      case 'POSTNATAL_6WEEK':
        return <ShieldCheck className="text-primary" size={40} />;
      default:
        return <Activity className="text-primary" size={40} />;
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto py-6 px-4">
        {/* Realtime update banner */}
        {hasUpdates && latestEvent && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 16px',
              marginBottom: 16,
              background: 'rgba(79,70,229,0.08)',
              border: '1px solid var(--primary)',
              borderRadius: 12,
              fontSize: 13,
              color: 'var(--primary)',
              fontWeight: 650,
            }}
          >
            <span>Live update: An appointment status was updated.</span>
            <button
              onClick={handleRealtimeRefresh}
              className="btn btn-sm text-xs font-bold text-white bg-primary py-1 px-3 rounded-lg"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Tab Filters - Text only, centered pill style matching image */}
        <div className="flex justify-center items-center gap-6 mb-8 py-2 border-b border-slate-100 dark:border-slate-800/60">

          {[
            { key: 'ONGOING', label: 'Ongoing' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'FINISHED', label: 'Finished' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'ONGOING' | 'PENDING' | 'FINISHED')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List - Single column centered rounded cards */}
        <div className="flex flex-col items-center gap-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => appt.status === 'UPCOMING' && setSelectedAppt(appt)}
                className="w-full card bg-white dark:bg-[#1A1F4A] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                {/* Top Centered Icon */}
                <div className="mb-4 flex items-center justify-center p-3 bg-primary/10 rounded-full">
                  {getAppointmentIcon(appt.appointment_type)}
                </div>

                {/* Title */}
                <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-2 leading-snug">
                  {appt.appointment_type.replace(/_/g, ' ')}
                </h3>

                {/* Date */}
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {formatReferenceDate(appt.scheduled_date)}
                </p>

                {appt.status === 'UPCOMING' && (
                  <span className="text-xs text-primary font-bold mt-4 bg-primary/10 px-4 py-1.5 rounded-full">
                    Tap to Reschedule
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="w-full text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={40} />
              <p className="text-slate-650 dark:text-slate-400 font-semibold mb-1">No appointments found.</p>
              <p className="text-slate-450 dark:text-slate-500 text-sm px-4">Check back later or contact your clinic to schedule a visit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card bg-white dark:bg-[#1A1F4A] border border-slate-200 dark:border-slate-800 shadow-xl p-6 md:p-8">
            
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Request Reschedule</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Rescheduling {selectedAppt.appointment_type.replace(/_/g, ' ')} appointment. Clinicians will be notified.
              </p>

              {submitSuccess ? (
                <div className="p-4 rounded-2xl border flex items-center gap-3 bg-green-500/10 border-green-500/20">
                  <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">{submitSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">New Date</label>
                    <input 
                      type="date" 
                      required
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">Preferred Time (Optional)</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-bold">Reason</label>
                    <textarea 
                      placeholder="e.g. Work conflict, feeling unwell..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-24 resize-none transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl border flex items-center gap-2 text-sm bg-red-500/10 border-red-500/20 text-red-750 dark:text-red-400">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedAppt(null);
                        setError('');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/95 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
