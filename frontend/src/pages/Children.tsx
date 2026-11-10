import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Baby, 
  Search, 
  Filter, 
  Download, 
  User, 
  ExternalLink,
  Activity,
  ChevronRight,
  UserRound,
  FileText,
  Stethoscope,
  RefreshCw,
  X
} from 'lucide-react';
import { pediatricsApi } from '../api';
import { ChildProfile, VaccinationRecord } from '../types';
import { formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function Children() {
  const { isAdmin, isDoctor } = useAuth();
  const canEdit = isAdmin || isDoctor;
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [editChild, setEditChild] = useState<ChildProfile | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'UNKNOWN',
    date_of_birth: '',
    birth_weight_kg: '',
    birth_certificate_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editChild) return;
    setSaving(true);
    setError('');
    try {
      await pediatricsApi.updateProfile(editChild.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        gender: editForm.gender,
        date_of_birth: editForm.date_of_birth,
        birth_weight_kg: editForm.birth_weight_kg ? parseFloat(editForm.birth_weight_kg) : null,
        birth_certificate_number: editForm.birth_certificate_number || null,
      });
      setEditChild(null);
      load();
    } catch (err) {
      setError('Failed to update child details. Please check the inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [profilesRes, vaccinesRes] = await Promise.all([
        pediatricsApi.listProfiles(),
        pediatricsApi.listVaccinations({ page_size: '2000' }),
      ]);
      const data = profilesRes.data;
      setChildren(data.results ?? data);
      setVaccinations(vaccinesRes.data.results ?? vaccinesRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vaccinationProgress = useMemo(() => {
    const progress: Record<number, { total: number; given: number }> = {};
    vaccinations.forEach((v) => {
      if (!progress[v.child]) {
        progress[v.child] = { total: 0, given: 0 };
      }
      progress[v.child].total += 1;
      if (v.status === 'GIVEN') {
        progress[v.child].given += 1;
      }
    });
    return progress;
  }, [vaccinations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return children.filter((c) => {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      const mother = (c.mother_details?.full_name ?? '').toLowerCase();
      if (q && !(name.includes(q) || mother.includes(q))) return false;
      if (genderFilter && c.gender !== genderFilter) return false;
      return true;
    });
  }, [children, search, genderFilter]);

  const exportCsv = () => {
    const header = ['Child Name', 'Mother', 'DOB', 'Gender', 'Birth Weight', 'Vaccination Progress'];
    const rows = filtered.map((c) => {
      const prog = vaccinationProgress[c.id] ?? { given: 0, total: 0 };
      const babyName = `${c.first_name || 'Baby'} ${c.last_name || ''}`.trim();
      return [
        babyName,
        c.mother_details?.full_name || '',
        c.date_of_birth,
        c.gender,
        c.birth_weight_kg || '',
        `${prog.given}/${prog.total}`,
      ];
    });

    const escape = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [header, ...rows]
      .map((row) => row.map((v) => escape(String(v))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'child-profiles.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <Baby className="text-primary" /> Child Profiles
          </h1>
          <div className="text-muted text-sm mt-1">
             Manage and track pediatric growth and vaccinations.
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="card mb-6" style={{ boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(180px, 0.7fr)',
              gap: 16,
              alignItems: 'end',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Search size={14} className="text-muted" /> Search
              </label>
              <input
                type="text"
                placeholder="Search by baby or mother..."
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Filter size={14} className="text-muted" /> Gender
              </label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : filtered.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon"><Baby size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No child profiles found</div>
            <div className="empty-desc">Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div className="card overflow-hidden p-0" style={{ boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                  <tr className="uppercase text-[11px] font-bold tracking-wider text-slate-500">
                    <th className="px-6 py-4">Baby Name</th>
                    <th className="px-6 py-4">Mother</th>
                    <th className="px-6 py-4 text-center">DOB</th>
                    <th className="px-6 py-4 text-center">Gender</th>
                    <th className="px-6 py-4 text-center">Birth Weight</th>
                    <th className="px-6 py-4 text-center">Vaccinations</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const progress = vaccinationProgress[c.id] ?? { given: 0, total: 0 };
                    return (
                      <tr key={c.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-6 py-4">
                          <div className="font-bold flex items-center gap-2">
                            {c.gender === 'FEMALE' ? <UserRound size={14} className="text-pink-500" /> : <UserRound size={14} className="text-blue-500" />}
                            {c.first_name || 'Baby'} {c.last_name || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/patients/${c.mother}`} className="flex items-center gap-2 hover:text-primary transition-colors text-sm">
                            <Stethoscope size={14} className="text-primary" /> {c.mother_details?.full_name || '—'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {formatDate(c.date_of_birth)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`badge ${c.gender === 'FEMALE' ? 'badge-purple' : 'badge-primary'} text-[10px]`}>
                            {c.gender}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-sm">
                          {c.birth_weight_kg ? `${c.birth_weight_kg} kg` : '—'}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-hosp-green transition-all" 
                                  style={{ width: `${(progress.given / (progress.total || 1)) * 100}%` }} 
                                />
                             </div>
                             <span className="text-[10px] font-bold text-slate-500">{progress.given}/{progress.total}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Link to={`/children/${c.id}`} className="btn btn-ghost btn-sm flex items-center gap-1">
                              View <ChevronRight size={14} />
                            </Link>
                            {canEdit && (
                              <button
                                className="btn btn-primary btn-sm flex items-center gap-1"
                                onClick={() => {
                                  setEditChild(c);
                                  setEditForm({
                                    first_name: c.first_name || '',
                                    last_name: c.last_name || '',
                                    gender: c.gender || 'UNKNOWN',
                                    date_of_birth: c.date_of_birth || '',
                                    birth_weight_kg: c.birth_weight_kg ? String(c.birth_weight_kg) : '',
                                    birth_certificate_number: c.birth_certificate_number || '',
                                  });
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editChild && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditChild(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Child Details</div>
              <button className="modal-close" onClick={() => setEditChild(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editForm.first_name}
                  onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editForm.last_name}
                  onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  className="form-input"
                  value={editForm.gender}
                  onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={editForm.date_of_birth}
                  onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={editForm.birth_weight_kg}
                  onChange={e => setEditForm(f => ({ ...f, birth_weight_kg: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Birth Certificate Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.birth_certificate_number}
                  onChange={e => setEditForm(f => ({ ...f, birth_certificate_number: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditChild(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
