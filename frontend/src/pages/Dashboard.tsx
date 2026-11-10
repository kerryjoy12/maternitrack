import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  Baby,
  AlertCircle,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Hand
} from 'lucide-react';
import { dashboardApi, pediatricsApi } from '../api';
import { DashboardSummary, VaccinationRecord } from '../types';
import { formatDate, getPersonalizedGreeting, STAGE_LABELS } from '../utils';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';


const PIE_COLORS = {
  upcoming: '#F59E0B',
  attended: '#10B981',
  missed: '#EF4444',
  rescheduled: '#8B5CF6',
};

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 0 18px rgba(99,102,241,0.18)',
  backdropFilter: 'blur(12px)',
};

const STAGE_BAR_COLOR = '#3B82F6';

function ExportCsvIcon() {
  return (
    <svg width={20} height={20} fill="none" viewBox="0 0 40 40" aria-hidden="true">
      <path
        stroke="#D5D7DA"
        strokeWidth={1.5}
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth={1.5} d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width={28} height={16} x={1} y={18} fill="#079455" rx={2} />
      <path
        fill="#fff"
        d="M11.273 25.273H9.717a1.5 1.5 0 0 0-.174-.536 1.4 1.4 0 0 0-.337-.405 1.5 1.5 0 0 0-.476-.255 1.8 1.8 0 0 0-.579-.09q-.564 0-.983.282-.42.276-.65.81-.231.528-.231 1.285 0 .777.23 1.306.236.53.654.8.42.27.97.27.309 0 .571-.082.267-.082.473-.238a1.4 1.4 0 0 0 .34-.387q.14-.228.192-.519l1.556.007q-.06.501-.302.966a2.9 2.9 0 0 1-.643.828 3 3 0 0 1-.959.575q-.554.21-1.253.21-.973 0-1.74-.44a3.13 3.13 0 0 1-1.208-1.276q-.44-.834-.44-2.02 0-1.19.447-2.024.448-.835 1.215-1.272a3.4 3.4 0 0 1 1.726-.44q.632 0 1.172.177.543.179.962.519.42.337.682.827.265.49.34 1.122m5.048-.454a.9.9 0 0 0-.366-.668q-.324-.238-.877-.238-.377 0-.636.107a.9.9 0 0 0-.398.288.7.7 0 0 0-.135.419.6.6 0 0 0 .082.34.85.85 0 0 0 .252.253q.16.103.37.18.21.075.447.129l.653.156q.477.106.874.284.398.177.689.437.291.259.45.61.164.353.168.807-.004.667-.341 1.157-.335.487-.966.757-.63.266-1.516.266-.882 0-1.534-.27a2.25 2.25 0 0 1-1.016-.799q-.362-.533-.38-1.317h1.488q.024.366.21.61.188.242.5.366.316.12.714.12.39 0 .678-.113a1.04 1.04 0 0 0 .451-.316.73.73 0 0 0 .16-.465q0-.244-.146-.412a1.1 1.1 0 0 0-.419-.284 4 4 0 0 0-.67-.213l-.793-.199q-.92-.224-1.452-.7-.533-.475-.53-1.282-.003-.66.352-1.154.36-.493.984-.77.625-.277 1.42-.277.81 0 1.414.277.608.276.944.77.338.494.348 1.144zm3.92-2.092L22 28.253h.067l1.762-5.526h1.704L23.026 30h-1.982l-2.51-7.273z"
      />
    </svg>
  );
}

function ExportPdfIcon() {
  return (
    <svg width={20} height={20} fill="none" viewBox="0 0 40 40" aria-hidden="true">
      <path
        stroke="#D5D7DA"
        strokeWidth={1.5}
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path stroke="#D5D7DA" strokeWidth={1.5} d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width={26} height={16} x={1} y={18} fill="#D92D20" rx={2} />
      <path
        fill="#fff"
        d="M4.832 30v-7.273h2.87q.826 0 1.41.316.582.314.887.87.31.555.31 1.279t-.313 1.278q-.313.555-.906.863-.59.309-1.427.309h-1.83V26.41h1.581q.444 0 .732-.153.29-.156.433-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.433-.423q-.291-.153-.74-.153H6.37V30zm9.053 0h-2.578v-7.273h2.6q1.095 0 1.889.437.791.433 1.218 1.246.43.814.43 1.947 0 1.136-.43 1.953a2.95 2.95 0 0 1-1.226 1.253q-.795.437-1.903.437m-1.04-1.317h.976q.682 0 1.147-.242.47-.244.703-.756.238-.516.238-1.328 0-.807-.238-1.318a1.54 1.54 0 0 0-.7-.753q-.465-.24-1.146-.241h-.98zM18.582 30v-7.273h4.816v1.268H20.12v1.733h2.958v1.268H20.12V30z"
      />
    </svg>
  );
}

const escapeCsvCell = (value: string | number | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

interface TrendData {
  period: string;
  series: { period: string; registrations: number; deliveries: number; missed_appointments: number }[];
  totals: { registrations: number; deliveries: number; missed_appointments: number };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = useMemo(() => getPersonalizedGreeting(user?.full_name), [user?.full_name]);

  useEffect(() => {
    if (user?.role === 'MOTHER') {
      navigate('/mother/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [roleData, setRoleData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'nurse' | 'doctor'>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'NURSE') {
      setActiveTab('nurse');
    } else if (user?.role === 'DOCTOR') {
      setActiveTab('doctor');
    } else {
      setActiveTab('general');
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes] = await Promise.allSettled([
        dashboardApi.summary(),
        dashboardApi.trends('weekly', 12)
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      } else {
        console.error('Dashboard summary failed:', sumRes.reason);
      }

      if (trendRes.status === 'fulfilled') {
        setTrends(trendRes.value.data);
      } else {
        console.error('Dashboard trends failed:', trendRes.reason);
      }

      if (sumRes.status === 'rejected') {
        const err: any = sumRes.reason;
        setError(err?.response?.data?.detail || err?.message || 'Unable to connect to dashboard API. Please ensure backend server is running.');
      }

      if (activeTab === 'nurse') {
        try {
          const nurseRes = await dashboardApi.nurseSummary();
          setRoleData(nurseRes.data);
        } catch (e) {
          console.error('Nurse summary failed:', e);
        }
      } else if (activeTab === 'doctor') {
        try {
          const docRes = await dashboardApi.doctorSummary();
          setRoleData(docRes.data);
        } catch (e) {
          console.error('Doctor summary failed:', e);
        }
      } else {
        setRoleData(null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const pieData = summary?.appointment_breakdown ? Object.entries(summary.appointment_breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v,
  })) : [];

  const stageData = summary?.stage_breakdown ? Object.entries(summary.stage_breakdown).map(([k, v]) => ({
    name: STAGE_LABELS[k as keyof typeof STAGE_LABELS] ?? k, value: v,
  })) : [];

  const exportReport = async (type: 'png' | 'pdf') => {
    if (!reportRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0D102B' : '#F8FAFC',
    });
    const dateStamp = new Date().toISOString().split('T')[0];
    if (type === 'png') {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `dashboard-report-${dateStamp}.png`;
      link.click();
      return;
    }
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`dashboard-report-${dateStamp}.pdf`);
  };

  const exportCsv = () => {
    if (!summary) return;

    const dateStamp = new Date().toISOString().split('T')[0];
    const rows: string[] = [];

    rows.push(['Section', 'Metric', 'Value'].map(escapeCsvCell).join(','));

    Object.entries(summary.kpis).forEach(([metric, value]) => {
      rows.push(['KPIs', metric, value].map(escapeCsvCell).join(','));
    });

    rows.push('');
    rows.push(['Section', 'Metric', 'Value'].map(escapeCsvCell).join(','));

    Object.entries(summary.appointment_breakdown).forEach(([metric, value]) => {
      rows.push(['Appointment Breakdown', metric, value].map(escapeCsvCell).join(','));
    });

    rows.push('');
    rows.push(['Section', 'Metric', 'Value'].map(escapeCsvCell).join(','));

    Object.entries(summary.stage_breakdown).forEach(([metric, value]) => {
      rows.push(['Stage Breakdown', metric, value].map(escapeCsvCell).join(','));
    });

    if (trends?.series?.length) {
      rows.push('');
      rows.push(['Trend Period', trends.period, ''].map(escapeCsvCell).join(','));
      rows.push(['Period', 'Registrations', 'Deliveries', 'Missed Appointments'].map(escapeCsvCell).join(','));

      trends.series.forEach(row => {
        rows.push([
          row.period,
          row.registrations,
          row.deliveries,
          row.missed_appointments,
        ].map(escapeCsvCell).join(','));
      });
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `dashboard-report-${dateStamp}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>


      <div
        ref={reportRef}
        className="page-body"
        style={{
          background: 'var(--bg-base)',
          minHeight: 'calc(100vh - 72px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `
              radial-gradient(circle at top left, rgba(139,92,246,0.18), transparent 25%),
              radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%),
              radial-gradient(circle at bottom center, rgba(34,211,238,0.10), transparent 35%)
            `,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <div
              className="loading-wrap"
              style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="spinner" />
            </div>
          ) : (
            <>
              <div
                className="relative flex flex-col lg:flex-row justify-between items-start mb-6 gap-4"
              >
                <div>
                  <h1
                    style={{
                      fontSize: '1.7rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    {greeting.salutation}
                  </h1>

                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.92rem',
                    }}
                  >
                    {greeting.wish} Here's what's happening in maternity today.
                  </p>

                  {user?.role === 'ADMIN' && (
                    <div className="flex flex-wrap gap-2 mt-4 mb-2 overflow-x-auto pb-1 max-w-full">
                      <button 
                        className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-ghost'}`} 
                        style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => setActiveTab('general')}
                      >
                        General Summary
                      </button>
                      <button 
                        className={`btn ${activeTab === 'nurse' ? 'btn-primary' : 'btn-ghost'}`} 
                        style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => setActiveTab('nurse')}
                      >
                        Nurse Registry
                      </button>
                      <button 
                        className={`btn ${activeTab === 'doctor' ? 'btn-primary' : 'btn-ghost'}`} 
                        style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => setActiveTab('doctor')}
                      >
                        Doctor Summary
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <div
                    className="hidden sm:flex"
                    style={{
                      ...glassButton,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '110px',
                      padding: '0 16px',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Export as
                  </div>

                  <button className="btn btn-ghost" style={{ ...glassButton, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={exportCsv} disabled={!summary}>
                    <ExportCsvIcon /> CSV
                  </button>

                  <button className="btn btn-ghost" style={{ ...glassButton, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => exportReport('pdf')}>
                    <ExportPdfIcon /> PDF
                  </button>

                  <button
                    aria-label="Refresh dashboard"
                    className="btn btn-ghost btn-icon"
                    style={{
                      ...glassButton,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={loadData}
                    disabled={loading}
                  >
                    <RefreshCw size={18} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>⚠️ {error}</span>
                  <button
                    onClick={loadData}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {((activeTab === 'general' && summary) || ((activeTab === 'nurse' || activeTab === 'doctor') && roleData) || (!loading && !error)) && (
                <>
                  {activeTab === 'general' && summary && (
                    <div className="big-metric-grid">
                      <ModernMetricCard
                        className="blue"
                        title="Total Active Patients"
                        value={summary?.kpis?.total_patients ?? 0}
                        trend=""
                        icon={<Users size={24} />}
                      />

                      <ModernMetricCard
                        className="green"
                        title="Due This Week"
                        value={summary?.kpis?.due_this_week ?? 0}
                        trend=""
                        icon={<Baby size={24} />}
                      />

                      <ModernMetricCard
                        className="purple"
                        title="Upcoming Appts"
                        value={summary?.kpis?.upcoming_this_week ?? 0}
                        trend=""
                        icon={<Calendar size={24} />}
                      />

                      <ModernMetricCard
                        className="orange"
                        title="High-Risk Patients"
                        value={summary?.kpis?.high_risk_patients ?? 0}
                        trend=""
                        icon={<AlertTriangle size={24} />}
                      />
                    </div>
                  )}

                  {activeTab === 'nurse' && roleData && (
                    <div className="big-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      <ModernMetricCard
                        className="blue"
                        title="Total Active Patients"
                        value={roleData.total_patients ?? 0}
                        trend=""
                        icon={<Users size={24} />}
                      />
                      <ModernMetricCard
                        className="purple"
                        title="Upcoming Appts"
                        value={roleData.upcoming_appointments ?? 0}
                        trend="Next 7 Days"
                        icon={<Calendar size={24} />}
                      />
                      <ModernMetricCard
                        className="green"
                        title="SMS Reminders Sent"
                        value={roleData.reminders_sent_today ?? 0}
                        trend="Today"
                        icon={<Activity size={24} />}
                      />
                      <ModernMetricCard
                        className="orange"
                        title="7-Day Reviews Pending"
                        value={roleData.postnatal_pending_7day ?? 0}
                        trend="Action required"
                        icon={<AlertTriangle size={24} />}
                      />
                      <ModernMetricCard
                        className="orange"
                        title="6-Week Reviews Pending"
                        value={roleData.postnatal_pending_6week ?? 0}
                        trend="Action required"
                        icon={<AlertCircle size={24} />}
                      />
                      <ModernMetricCard
                        className="blue"
                        title="Child Profiles Logged"
                        value={roleData.total_children ?? 0}
                        trend=""
                        icon={<Baby size={24} />}
                      />
                    </div>
                  )}

                  {activeTab === 'doctor' && roleData && (
                    <div className="big-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      <ModernMetricCard
                        className="orange"
                        title="High-Risk Patients"
                        value={roleData.high_risk_patients ?? 0}
                        trend="Critical Follow-up"
                        icon={<AlertTriangle size={24} />}
                      />
                      <ModernMetricCard
                        className="purple"
                        title="Critical Alerts Unresolved"
                        value={roleData.critical_alerts ?? 0}
                        trend="Requires Action"
                        icon={<AlertCircle size={24} />}
                      />
                      <ModernMetricCard
                        className="purple"
                        title="Open Clinical Tickets"
                        value={roleData.unresolved_tickets ?? 0}
                        trend="Assigned"
                        icon={<Users size={24} />}
                      />
                      <ModernMetricCard
                        className="green"
                        title="Mortality Audits Done"
                        value={roleData.mortality_reviews ?? 0}
                        trend="Archived Reviews"
                        icon={<Users size={24} />}
                      />
                      <ModernMetricCard
                        className="blue"
                        title="Completed Procedures"
                        value={roleData.procedures_this_month ?? 0}
                        trend="This Month"
                        icon={<Users size={24} />}
                      />
                    </div>
                  )}

                  <div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
                  >
                    <div className="lg:col-span-2">
                      <GlassCard>
                        <div className="flex-between mb-4">
                          <div>
                            <div
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              Patient Visits
                            </div>

                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Last 12 weeks • Granularity: weekly
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              color: '#34D399',
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid rgba(52,211,153,0.2)',
                            }}
                          >
                            ● Total: {trends?.totals?.registrations ?? 0}
                          </div>
                        </div>

                        {trends && trends?.series?.length > 0 ? (
                          <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={trends.series}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  bottom: 0,
                                  left: -20,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="rgba(148,163,184,0.15)"
                                />

                                <XAxis
                                  dataKey="period"
                                  tick={{
                                    fill: 'var(--text-muted)',
                                    fontSize: 11,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />

                                <YAxis
                                  tick={{
                                    fill: 'var(--text-muted)',
                                    fontSize: 11,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />

                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />

                                <Line
                                  type="monotone"
                                  dataKey="registrations"
                                  stroke="#60A5FA"
                                  strokeWidth={3}
                                  dot={{
                                    fill: '#60A5FA',
                                    strokeWidth: 2,
                                    r: 4,
                                  }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <EmptyState />
                        )}
                      </GlassCard>
                    </div>

                    <div
                      className="flex flex-col gap-4"
                    >
                      <SideKpiCard
                        icon={<Calendar size={22} />}
                        label="Upcoming Appointments"
                        value={summary?.kpis?.upcoming_this_week || 0}
                      />

                      <SideKpiCard
                        icon={<Activity size={22} />}
                        label="Postnatal Checks Needed"
                        value={summary?.kpis?.postnatal_pending_6week || 0}
                      />

                      <SideKpiCard
                        icon={<AlertTriangle size={22} />}
                        label="Missed Appointments"
                        value={summary?.kpis?.missed_appointments || 0}
                      />

                      <SideKpiCard
                        icon={<Baby size={22} />}
                        label="Overdue Deliveries"
                        value={summary?.kpis?.overdue_delivery || 0}
                      />
                    </div>
                  </div>

                  {/* Additional Stats Row */}
                  <div className="stats-row">
                    <div className="stat-card blue">
                      <div className="stat-value">{trends?.totals?.registrations ?? 0}</div>
                      <div className="stat-label">Total Registrations</div>
                      <div className="stat-trend flex items-center gap-1"><ArrowUpRight size={14} /> This period</div>
                    </div>
                    <div className="stat-card green">
                      <div className="stat-value">{trends?.totals?.deliveries ?? 0}</div>
                      <div className="stat-label">New Deliveries</div>
                      <div className="stat-trend flex items-center gap-1"><ArrowUpRight size={14} /> This period</div>
                    </div>
                    <div className="stat-card orange">
                      <div className="stat-value">{summary?.kpis?.postnatal_pending_7day ?? 0}</div>
                      <div className="stat-label">Pending Reviews</div>
                      <div style={{ fontSize: '0.7rem', color: '#D97706' }}>Awaiting action</div>
                    </div>
                    <div className="stat-card green">
                      <div className="stat-value">{summary?.appointment_breakdown?.attended ?? 0}</div>
                      <div className="stat-label">Attended Appointments</div>
                      <div className="stat-trend">↗ Total attended</div>
                    </div>
                    <div className="stat-card purple">
                      <div className="stat-value">{summary?.kpis?.missed_appointments ?? 0}</div>
                      <div className="stat-label">Total Missed</div>
                      <div style={{ fontSize: '0.7rem', color: '#8B5CF6' }}>This period</div>
                    </div>
                    <div className="stat-card blue">
                      <div className="stat-value">{trends?.totals?.missed_appointments ?? 0}</div>
                      <div className="stat-label">Missed (Trend)</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Last 12 weeks</div>
                    </div>
                  </div>

                  {/* Bottom Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <GlassCard>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Patients by Clinic Stage</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Active maternity tracking</div>
                      <div style={{ width: '100%', height: 240, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stageData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Bar dataKey="value" fill={STAGE_BAR_COLOR} radius={[6, 6, 0, 0]} barSize={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>

                    <GlassCard>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Appointment Status</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Breakdown across all records</div>
                      <div style={{ width: '100%', height: 240, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="35%" cy="50%" outerRadius={75} innerRadius={50} label={false}>
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase() as keyof typeof PIE_COLORS] ?? 'var(--text-muted)'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const glassButton = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  color: 'var(--text-primary)',
  backdropFilter: 'blur(12px)',
  boxShadow: 'var(--shadow-card)',
};

function GlassCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="card"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(18px)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 24,
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.25s ease',
      }}
    >
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
      }}
    >
      No trend data available
    </div>
  );
}

function SideKpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.25s ease',
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18))',
          color: '#818CF8',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function ModernMetricCard({
  title,
  value,
  trend,
  className,
  icon
}: {
  title: string;
  value: number;
  trend: string;
  className: string;
  icon?: ReactNode;
}) {
  const gradients: Record<string, string> = {
    blue: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    green: 'linear-gradient(135deg, #059669, #10B981)',
    purple: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
    orange: 'linear-gradient(135deg, #EA580C, #F97316)',
  };

  return (
    <div
      className={`big-metric-card ${className}`}
      style={{
        background: gradients[className],
        borderRadius: 28,
        padding: 24,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 14px 35px rgba(0,0,0,0.35)',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 16 }}>
            {icon}
          </div>
          <div className="trend-badge" style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem' }}>
            {trend}
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.9, marginTop: 8 }}>{title}</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    </div>
  );
}
