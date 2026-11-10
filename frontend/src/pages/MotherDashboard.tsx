import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Calendar, 
  Baby, 
  ShieldAlert, 
  MessageSquare, 
  AlertTriangle, 
  AlertCircle, 
  Phone, 
  Clock, 
  Info,
  CalendarDays,
  Ambulance,
  Building2,
  Stethoscope,
  CheckCheck
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherDashboardData, SecureMessage, UpcomingVaccine } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';
import { useAuth } from '../context/AuthContext';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';

export default function MotherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<MotherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Subscribe to real-time secure messages for this mother
  const { liveMessages, unreadCount: realtimeUnreadCount } = useRealtimeMessages(user?.patient_id);


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await motherApi.dashboard();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p>{error || 'No data available.'}</p>
      </div>
    );
  }

  const {
    pregnancy_status,
    gestational_age_weeks,
    expected_delivery_date,
    trimester,
    next_appointment,
    upcoming_vaccines,
    unread_messages_count,
    care_alerts,
    risk_level
  } = data;

  const handleMarkCareAlertRead = async (id: number) => {
    try {
      await motherApi.markCareAlertRead(id);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        
        {/* Hero Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-pink-500/10 dark:from-primary/20 dark:to-pink-500/20">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.dashboard})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.65) saturate(1.1)',
                opacity: 0.15
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-850 dark:text-white mb-2 flex items-center gap-2">
                  Your Pregnancy Journey <Heart className="text-primary fill-primary animate-pulse" size={28} />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
                  Real-time health monitoring and care insights for you and your baby
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {unread_messages_count + realtimeUnreadCount > 0 && (
                  <div className="px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary shadow-sm">
                    <MessageSquare size={16} />
                    {unread_messages_count + realtimeUnreadCount} Unread
                  </div>
                )}
                <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border shadow-sm ${
                  risk_level === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400'
                    : risk_level === 'MEDIUM'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-650 dark:text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-650 dark:text-emerald-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    risk_level === 'HIGH' ? 'bg-red-500' : risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  {risk_level} RISK
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Stats Cards (2 columns) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Gestational Age */}
            <div className="card p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Gestational Age</span>
                <div className="p-2 rounded-xl bg-primary/10">
                  <Baby className="text-primary" size={20} />
                </div>
              </div>
              <div>
                <h2 className="text-5xl font-extrabold text-slate-800 dark:text-white mb-2">{gestational_age_weeks}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Weeks • <span className="text-primary">{trimester || 'Postnatal'}</span>
                </p>
              </div>
            </div>

            {/* Expected Delivery Date */}
            <div className="card p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Expected Delivery</span>
                <div className="p-2 rounded-xl bg-teal-500/10">
                  <CalendarDays className="text-teal-600 dark:text-teal-400" size={20} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">{formatDate(expected_delivery_date)}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{pregnancy_status}</p>
              </div>
            </div>

            {/* Next Appointment */}
            <div 
              onClick={() => navigate('/mother/appointments')}
              className="md:col-span-2 card p-6 shadow-sm cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Next Appointment</span>
                <div className="p-2 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
              </div>
              {next_appointment ? (
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{next_appointment.appointment_type}</h3>
                  <p className="text-primary font-semibold text-sm mb-2">
                    {formatDate(next_appointment.scheduled_date)} at {next_appointment.scheduled_time || 'TBD'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    {next_appointment.notes || 'No notes from clinician'}
                  </p>
                </div>
              ) : (
                <div className="py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                    <Info size={16} /> No upcoming appointments scheduled
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Sidebar */}
          <div className="card p-6 shadow-sm border-t-4 border-t-red-500">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <ShieldAlert size={20} /> Emergency Contacts
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs mb-6 leading-relaxed">
              If you experience severe bleeding, headaches, vision loss, or high fever, call immediately.
            </p>
            <div className="space-y-3">
              <a href="tel:999" className="flex items-center justify-between p-3.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors border border-red-100 dark:border-red-500/20">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Ambulance size={16} /> Ambulance Dispatch
                </span>
                <Phone size={16} className="animate-pulse" />
              </a>
              <a href="tel:+254700000000" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <Building2 size={16} /> Hospital Hotline
                </span>
                <Phone size={16} className="text-slate-400" />
              </a>
              <a href="tel:+254711111111" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <Baby size={16} /> Maternity Ward
                </span>
                <Phone size={16} className="text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Alerts & Vaccines Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Alerts */}
          <div className="card p-6 shadow-sm border-t-4 border-t-amber-500">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={20} />
              Important Alerts
            </h2>
            {(() => {
              const allAlerts: SecureMessage[] = [
                ...liveMessages.map((msg) => ({
                  id: msg.id,
                  sender: 0,
                  sender_name: 'Care Team (Live)',
                  recipient: user?.patient_id ?? 0,
                  patient: user?.patient_id ?? 0,
                  message_type: 'CARE_ALERT' as const,
                  message: msg.message,
                  created_at: msg.created_at,
                  is_read: false,
                  parent_message: null
                })),
                ...(care_alerts ?? [])
              ];
              
              return allAlerts.length > 0 ? (
                <div className="space-y-3">
                  {allAlerts.map((alert: SecureMessage) => (
                    <div key={alert.id} className={`p-4 rounded-xl flex gap-3 items-start border ${
                      alert.is_read 
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700' 
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                    }`}>
                      <Stethoscope className={`shrink-0 mt-0.5 ${alert.is_read ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}`} size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>{alert.sender_name || 'Care Team'}</span>
                          {!alert.is_read && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">{alert.message}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-2">{formatDate(alert.created_at)}</p>
                      </div>
                      {!alert.is_read && alert.sender !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMarkCareAlertRead(alert.id)}
                          className="shrink-0 p-2 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                    <Info size={16} /> No messages from your care team at this time
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Vaccines */}
          <div className="card p-6 shadow-sm border-t-4 border-t-primary">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Recommended Vaccines
            </h2>
            {upcoming_vaccines && upcoming_vaccines.length > 0 ? (
              <div className="space-y-3">
                {upcoming_vaccines.map((vac: UpcomingVaccine, i: number) => (
                  <div key={i} className="p-4 rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{vac.vaccine_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target: <span className="text-primary font-semibold">{vac.target}</span>
                        {vac.recommended_week && ` • Week ${vac.recommended_week}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      vac.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        : vac.status === 'DUE'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {vac.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Info size={16} /> No vaccination schedule found
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
