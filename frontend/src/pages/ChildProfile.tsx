import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Baby, 
  ChevronRight, 
  Activity, 
  Scale, 
  Ruler, 
  Syringe, 
  CheckCircle, 
  Clock, 
  FileDown,
  TrendingUp,
  X,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { pediatricsApi } from '../api';
import { ChildProfile, GrowthRecord, VaccinationRecord } from '../types';
import { formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  boxShadow: 'var(--shadow-card)',
};

const VACCINE_STAGES = [
  { label: 'At Birth', vaccines: ['BCG', 'OPV0'] },
  { label: '6 Weeks', vaccines: ['PENTA1', 'OPV1', 'PCV1', 'ROTA1'] },
  { label: '10 Weeks', vaccines: ['PENTA2', 'OPV2', 'PCV2', 'ROTA2'] },
  { label: '14 Weeks', vaccines: ['PENTA3', 'OPV3', 'PCV3', 'IPV'] },
  { label: '9 Months', vaccines: ['MEASLES_RUBELLA', 'MEASLES1'] },
  { label: 'Other / Follow-up', vaccines: ['MEASLES2', 'VITAMIN_A', 'OTHER'] },
];

export default function ChildProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [updating, setUpdating] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', gender: 'UNKNOWN',
    date_of_birth: '', birth_weight_kg: '', birth_certificate_number: '',
  });

  const [growthForm, setGrowthForm] = useState({
    date_recorded: new Date().toISOString().split('T')[0],
    weight_kg: '', height_cm: '', head_circumference_cm: '', notes: ''
  });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, growthRes, vacRes] = await Promise.all([
        pediatricsApi.getProfile(+id),
        pediatricsApi.listGrowth({ child: id }),
        pediatricsApi.listVaccinations({ child: id }),
      ]);
      setProfile(profileRes.data);
      
      // Sort growth records chronologically for graphs
      const sortedGrowth = (growthRes.data.results ?? growthRes.data).sort((a: any, b: any) => 
        new Date(a.date_recorded).getTime() - new Date(b.date_recorded).getTime()
      );
      setGrowthRecords(sortedGrowth);
      
      setVaccinations(vacRes.data.results ?? vacRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile) return;
    setSaving(true);
    try {
      await pediatricsApi.updateProfile(+id, {
        first_name: editForm.first_name, last_name: editForm.last_name,
        gender: editForm.gender, date_of_birth: editForm.date_of_birth,
        birth_weight_kg: editForm.birth_weight_kg ? parseFloat(editForm.birth_weight_kg) : null,
        birth_certificate_number: editForm.birth_certificate_number || null,
      });
      setShowEditModal(false);
      await load();
    } catch (err) {
      alert('Failed to update child details.');
    } finally { setSaving(false); }
  };

  const handleGrowthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await pediatricsApi.createGrowth({
        child: +id,
        date_recorded: growthForm.date_recorded,
        weight_kg: growthForm.weight_kg ? parseFloat(growthForm.weight_kg) : null,
        height_cm: growthForm.height_cm ? parseFloat(growthForm.height_cm) : null,
        head_circumference_cm: growthForm.head_circumference_cm ? parseFloat(growthForm.head_circumference_cm) : null,
        notes: growthForm.notes
      });
      setShowGrowthModal(false);
      setGrowthForm({ date_recorded: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', head_circumference_cm: '', notes: '' });
      await load();
    } catch (err) {
      alert('Failed to save growth record.');
    } finally { setSaving(false); }
  };

  const markGiven = async (v: VaccinationRecord) => {
    setUpdating(v.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      await pediatricsApi.updateVaccination(v.id, { status: 'GIVEN', given_date: v.given_date || today });
      await load();
    } finally { setUpdating(null); }
  };

  const exportPDF = async () => {
    if (!pdfRef.current || !profile) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Child_Welfare_${profile.first_name || 'Record'}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };

  const exportCSV = () => {
    if (!profile) return;
    let csv = `Child Profile,${profile.first_name} ${profile.last_name},DOB:,${profile.date_of_birth}\n\n`;
    csv += `Date,Weight (kg),Height (cm),Head Circ (cm),Notes\n`;
    growthRecords.forEach(r => {
      csv += `${r.date_recorded},${r.weight_kg||''},${r.height_cm||''},${r.head_circumference_cm||''},"${r.notes||''}"\n`;
    });
    csv += `\nVaccine,Expected Date,Status,Given Date\n`;
    vaccinations.forEach(v => {
      csv += `${v.vaccine_name_display || v.vaccine_name},${v.expected_date||''},${v.status},${v.given_date||''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Child_Welfare_${profile.first_name || 'Record'}.csv`;
    a.click();
  };

  // Derived Summary Data
  const currentAge = useMemo(() => {
    if (!profile?.date_of_birth) return '—';
    const dob = new Date(profile.date_of_birth);
    const diff = new Date().getTime() - dob.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} yrs ${Math.floor((days % 365) / 30)} mos`;
  }, [profile]);

  const currentWeight = useMemo(() => {
    if (growthRecords.length === 0) return profile?.birth_weight_kg ? `${profile.birth_weight_kg} kg (Birth)` : '—';
    return `${growthRecords[growthRecords.length - 1].weight_kg || '—'} kg`;
  }, [growthRecords, profile]);

  const nextVaccine = useMemo(() => {
    const pending = vaccinations.filter(v => v.status === 'PENDING' && v.expected_date);
    if (pending.length === 0) return 'Up to date';
    pending.sort((a, b) => new Date(a.expected_date!).getTime() - new Date(b.expected_date!).getTime());
    return `${pending[0].vaccine_name_display || pending[0].vaccine_name} (Due: ${formatDate(pending[0].expected_date!)})`;
  }, [vaccinations]);

  const lastVisit = useMemo(() => {
    if (growthRecords.length === 0) return 'No visits yet';
    return formatDate(growthRecords[growthRecords.length - 1].date_recorded);
  }, [growthRecords]);

  if (loading) return <div className="page-body loading-wrap"><div className="spinner" /></div>;
  if (!profile) return <div className="page-body"><p>Child profile not found.</p></div>;

  return (
    <>
      <header className="page-header">
        <div className="flex items-center gap-4">
          <Link to={`/patients/${profile.mother}`} className="btn btn-ghost btn-sm">
             <ChevronRight size={14} className="rotate-180" /> Back
          </Link>
          <h1 className="flex items-center gap-2 m-0 text-2xl font-bold">
            <Baby className="text-primary" /> {profile.first_name || 'Baby'} {profile.last_name || ''}
          </h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={exportCSV}>
            <FileDown size={16} /> CSV
          </button>
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={exportPDF}>
            <FileDown size={16} /> Export PDF
          </button>
        </div>
      </header>

      <div className="page-body" ref={pdfRef} style={{ background: 'var(--bg-base)', padding: '16px' }}>
        {/* Child Welfare Summary Card */}
        <div className="card mb-6 border-none shadow-sm">
          <div className="flex-between mb-4">
            <div className="section-title m-0">Child Welfare Summary</div>
            {isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setEditForm({
                  first_name: profile.first_name || '', last_name: profile.last_name || '',
                  gender: profile.gender || 'UNKNOWN', date_of_birth: profile.date_of_birth || '',
                  birth_weight_kg: profile.birth_weight_kg ? String(profile.birth_weight_kg) : '',
                  birth_certificate_number: profile.birth_certificate_number || '',
                });
                setShowEditModal(true);
              }}>
                Edit Profile
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="kpi-card primary" style={{ padding: '16px' }}>
              <div className="text-muted text-xs uppercase font-bold flex items-center gap-1 mb-1"><Clock size={14}/> Current Age</div>
              <div className="font-bold text-xl">{currentAge}</div>
            </div>
            <div className="kpi-card success" style={{ padding: '16px' }}>
              <div className="text-muted text-xs uppercase font-bold flex items-center gap-1 mb-1"><Scale size={14}/> Current Weight</div>
              <div className="font-bold text-xl">{currentWeight}</div>
            </div>
            <div className="kpi-card warning" style={{ padding: '16px' }}>
              <div className="text-muted text-xs uppercase font-bold flex items-center gap-1 mb-1"><Syringe size={14}/> Next Vaccine</div>
              <div className="font-bold text-sm mt-1">{nextVaccine}</div>
            </div>
            <div className="kpi-card neutral" style={{ padding: '16px' }}>
              <div className="text-muted text-xs uppercase font-bold flex items-center gap-1 mb-1"><Activity size={14}/> Last Clinic Visit</div>
              <div className="font-bold text-lg">{lastVisit}</div>
            </div>
          </div>
        </div>

        {/* Growth Trend Section */}
        <div className="card mb-6 border-none shadow-sm">
          <div className="flex-between mb-4">
            <div className="section-title flex items-center gap-2 m-0">
              <TrendingUp size={20} className="text-primary" /> Growth Trends
            </div>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowGrowthModal(true)}>
              <Plus size={16} /> Record Visit
            </button>
          </div>

          {growthRecords.length === 0 ? (
            <div className="empty-state p-6">
              <div className="empty-title">No growth records yet</div>
              <div className="empty-desc">Record the child's weight and height at their first clinic visit to generate growth plots.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Weight Graph */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px' }}>
                <h4 className="font-bold text-sm mb-4 text-center">Weight (kg)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growthRecords} margin={{ left: -20, right: 10, bottom: 0, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date_recorded" tick={{ fontSize: 10 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatDate} />
                    <Line type="monotone" dataKey="weight_kg" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Weight" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Height Graph */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px' }}>
                <h4 className="font-bold text-sm mb-4 text-center">Height (cm)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growthRecords} margin={{ left: -20, right: 10, bottom: 0, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date_recorded" tick={{ fontSize: 10 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatDate} />
                    <Line type="monotone" dataKey="height_cm" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Height" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Head Circumference Graph */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px' }}>
                <h4 className="font-bold text-sm mb-4 text-center">Head Circumference (cm)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growthRecords} margin={{ left: -20, right: 10, bottom: 0, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date_recorded" tick={{ fontSize: 10 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatDate} />
                    <Line type="monotone" dataKey="head_circumference_cm" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Head Circ" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Immunizations Section Grouped by Stage */}
        <div className="card border-none shadow-sm">
          <div className="section-title flex items-center gap-2">
            <Syringe size={20} className="text-primary" /> Immunization Schedule (EPI)
          </div>
          
          <div className="mt-4 flex flex-col gap-6">
            {VACCINE_STAGES.map(stage => {
              const stageVaccines = vaccinations.filter(v => stage.vaccines.includes(v.vaccine_name));
              if (stageVaccines.length === 0) return null;
              
              return (
                <div key={stage.label} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 font-bold text-sm flex justify-between items-center text-slate-700">
                    {stage.label}
                    <span className="text-xs font-normal opacity-80">
                      {stageVaccines.filter(v => v.status === 'GIVEN').length} / {stageVaccines.length} Given
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white border-b border-slate-100">
                        <tr className="uppercase text-[10px] font-bold tracking-wider text-slate-400">
                          <th className="px-4 py-2 w-1/3">Vaccine</th>
                          <th className="px-4 py-2">Expected Date</th>
                          <th className="px-4 py-2 text-center">Status</th>
                          <th className="px-4 py-2">Given Date</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {stageVaccines.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium">{v.vaccine_name_display || v.vaccine_name}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{v.expected_date ? formatDate(v.expected_date) : '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`badge badge-${v.status === 'GIVEN' ? 'success' : v.status === 'MISSED' ? 'danger' : 'warning'} text-[10px]`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{v.given_date ? formatDate(v.given_date) : '—'}</td>
                            <td className="px-4 py-3 text-right">
                              {v.status !== 'GIVEN' && (
                                <button
                                  className="btn btn-success btn-xs inline-flex items-center gap-1"
                                  onClick={() => markGiven(v)}
                                  disabled={updating === v.id}
                                >
                                  <CheckCircle size={14} /> {updating === v.id ? 'Saving...' : 'Mark Given'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Record Growth Modal */}
      {showGrowthModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowGrowthModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Record Clinic Visit & Growth</div>
              <button className="modal-close" onClick={() => setShowGrowthModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGrowthSubmit}>
              <div className="form-group">
                <label className="form-label">Visit Date *</label>
                <input type="date" required className="form-input" value={growthForm.date_recorded} onChange={e => setGrowthForm(f => ({ ...f, date_recorded: e.target.value }))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Weight (kg) *</label>
                  <input type="number" step="0.01" required className="form-input" value={growthForm.weight_kg} onChange={e => setGrowthForm(f => ({ ...f, weight_kg: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input type="number" step="0.1" className="form-input" value={growthForm.height_cm} onChange={e => setGrowthForm(f => ({ ...f, height_cm: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Head Circumference (cm)</label>
                  <input type="number" step="0.1" className="form-input" value={growthForm.head_circumference_cm} onChange={e => setGrowthForm(f => ({ ...f, head_circumference_cm: e.target.value }))} />
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Clinical Notes / Nutrition</label>
                <textarea className="form-textarea" value={growthForm.notes} onChange={e => setGrowthForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowGrowthModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Child Details</div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group"><label className="form-label">First Name *</label><input type="text" className="form-input" required value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input type="text" className="form-input" required value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-input" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="UNKNOWN">Unknown</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Date of Birth *</label><input type="date" className="form-input" required value={editForm.date_of_birth} onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Birth Weight (kg)</label><input type="number" step="0.01" className="form-input" value={editForm.birth_weight_kg} onChange={e => setEditForm(f => ({ ...f, birth_weight_kg: e.target.value }))} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}