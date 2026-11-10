import { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  Bell, 
  CheckCircle, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  BellRing,
  MessageSquare
} from 'lucide-react';
import { alertsApi } from '../api';
import { ClinicalAlert } from '../types';
import AlertFollowUpModal from '../components/AlertFollowUpModal';

export default function Alerts() {
  const [alerts, setAlerts]   = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'unacknowledged'>('unacknowledged');
  const [followUpAlert, setFollowUpAlert] = useState<ClinicalAlert | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter === 'unacknowledged') params.unacknowledged = 'true';
      const { data } = await alertsApi.list(params);
      setAlerts(data.results ?? data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const sevColor = (s: string) =>
    s === 'CRITICAL' ? 'var(--danger)' : 'var(--warning, #f59e0b)';

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <Bell className="text-primary" size={28} /> Clinical Alerts
        </h1>
        <div className="header-actions">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted" />
            <select
              className="form-select"
              value={filter}
              onChange={e => setFilter(e.target.value as 'all' | 'unacknowledged')}
              style={{ width: 200 }}
            >
              <option value="unacknowledged">Pending Follow-up</option>
              <option value="all">All Alerts</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={load}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle size={48} className="text-success" /></div>
              <div className="empty-title">All clear</div>
              <div className="empty-desc">
                {filter === 'unacknowledged'
                  ? 'All clinical alerts have been followed up.'
                  : 'No clinical alerts have been generated yet.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Patient</th>
                    <th>Value</th>
                    <th>Threshold</th>
                    <th>Message</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a.id}>
                      <td>
                        <span
                          className="badge flex items-center gap-1"
                          style={{ background: sevColor(a.severity), color: '#fff' }}
                        >
                          {a.severity === 'CRITICAL' ? <BellRing size={12} /> : <AlertTriangle size={12} />} {a.severity}
                        </span>
                      </td>
                      <td>{a.alert_type_display}</td>
                      <td>
                        <a href={`/patients/${a.patient}`} className="text-link">
                          {a.patient_name}
                        </a>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {a.patient_number}
                        </div>
                      </td>
                      <td className="mono">{a.value_triggered}</td>
                      <td className="mono text-muted">{a.threshold}</td>
                      <td style={{ maxWidth: 260, fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>{a.message}</td>
                      <td className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(a.created_at).toLocaleString('en-KE', {
                          dateStyle: 'short', timeStyle: 'short',
                        })}
                      </td>
                      <td>
                        {a.acknowledged ? (
                          <span className="badge badge-success">
                            Followed up by {a.acknowledged_by_name}
                          </span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {!a.acknowledged && (
                          <button
                            className="btn btn-sm btn-primary flex items-center gap-1"
                            onClick={() => setFollowUpAlert(a)}
                          >
                            <MessageSquare size={14} />
                            Follow Up
                          </button>
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

      <AlertFollowUpModal
        alert={followUpAlert}
        onClose={() => setFollowUpAlert(null)}
        onSuccess={load}
      />
    </>
  );
}
