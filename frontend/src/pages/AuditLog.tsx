import React, { useState } from 'react';
import { 
  History, 
  Search, 
  User, 
  Clock, 
  PlusCircle, 
  Edit, 
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auditApi } from '../api';
import { AuditEntry } from '../types';

const MODEL_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'partograph', label: 'Partograph Entry' },
  { value: 'postnatal', label: 'Postnatal Record' },
];

export default function AuditLog() {
  const [model, setModel]     = useState('patient');
  const [pk, setPk]           = useState('');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Filters
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [actionType, setActionType] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pk) return;
    setLoading(true);
    setError('');

    const params: any = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (actionType) params.action_type = actionType;
    if (userFilter) params.user = userFilter;

    try {
      const { data } = await auditApi.getHistory(model, Number(pk), params);
      setEntries(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load audit history.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setActionType('');
    setUserFilter('');
    // Trigger reload with only model and pk
    if (pk) {
      setLoading(true);
      setError('');
      auditApi.getHistory(model, Number(pk))
        .then(({ data }: { data: any }) => setEntries(data))
        .catch((err: any) => {
          setError(err.response?.data?.error ?? 'Failed to load audit history.');
          setEntries([]);
        })
        .finally(() => setLoading(false));
    }
  };

  const typeLabel = (t: string) =>
    t === '+' ? (
      <span className="flex items-center gap-1 text-success">
        <PlusCircle size={14} /> Created
      </span>
    ) : t === '~' ? (
      <span className="flex items-center gap-1 text-warning">
        <Edit size={14} /> Updated
      </span>
    ) : (
      <span className="flex items-center gap-1 text-danger">
        <Trash2 size={14} /> Deleted
      </span>
    );

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <History className="text-primary" size={28} /> Audit Trail
        </h1>
      </header>

      <div className="page-body">
        <div className="card mb-6">
          <div className="section-title flex items-center gap-2">
            <Search size={20} className="text-primary" /> Lookup Record History
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 180px', minWidth: 0 }}>
              <label className="form-label flex items-center gap-1">
                <Database size={14} /> Record Type
              </label>
              <select className="form-select" value={model} onChange={e => setModel(e.target.value)}>
                {MODEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 100px', minWidth: 0 }}>
              <label className="form-label flex items-center gap-1">
                <Database size={14} /> Record ID
              </label>
              <input className="form-input" type="number" min="1" placeholder="e.g. 1" value={pk}
                onChange={e => setPk(e.target.value)} />
            </div>

            <div className="form-group" style={{ flex: '1 1 130px', minWidth: 0 }}>
              <label className="form-label">Action Type</label>
              <select className="form-select" value={actionType} onChange={e => setActionType(e.target.value)}>
                <option value="">All Actions</option>
                <option value="+">Created</option>
                <option value="~">Updated</option>
                <option value="-">Deleted</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: '1 1 130px', minWidth: 0 }}>
              <label className="form-label">From Date</label>
              <input className="form-input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            <div className="form-group" style={{ flex: '1 1 130px', minWidth: 0 }}>
              <label className="form-label">To Date</label>
              <input className="form-input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>

            <div className="form-group" style={{ flex: '1 1 160px', minWidth: 0 }}>
              <label className="form-label">Changed By</label>
              <input className="form-input" type="text" placeholder="Name or email..." value={userFilter} onChange={e => setUserFilter(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={loading || !pk}>
                <Search size={18} /> {loading ? 'Loading…' : 'Search'}
              </button>
              <button type="button" className="btn btn-ghost flex items-center gap-2" onClick={handleClearFilters} disabled={loading}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {error && <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>}

        {entries.length > 0 && (
          <div className="card">
            <div className="section-title flex items-center gap-2">
              <History size={20} className="text-primary" /> Change History ({entries.length} entries)
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Date</th>
                    <th>Changed By</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.history_id}>
                      <td>{typeLabel(e.history_type)}</td>
                      <td className="text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(e.history_date).toLocaleString('en-KE', {
                            dateStyle: 'short', timeStyle: 'short',
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-muted" /> {e.history_user}
                        </div>
                      </td>
                      <td>
                        {Object.keys(e.changes).length === 0 ? (
                          <span className="text-muted flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                            <CheckCircle2 size={12} /> Initial record
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {Object.entries(e.changes).map(([field, vals]) => (
                              <div key={field} style={{ fontSize: '0.8rem' }}>
                                <strong>{field}</strong>:{' '}
                                <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>
                                  {vals.old ?? '(empty)'}
                                </span>
                                {' → '}
                                <span style={{ color: 'var(--success, #22c55e)' }}>
                                  {vals.new ?? '(empty)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
