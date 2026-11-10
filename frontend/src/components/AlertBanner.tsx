import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { alertsApi } from '../api';
import { ClinicalAlert } from '../types';
import AlertFollowUpModal from './AlertFollowUpModal';

const POLL_INTERVAL = 30_000;

export default function AlertBanner() {
  const [alerts, setAlerts]   = useState<ClinicalAlert[]>([]);
  const [total, setTotal]     = useState(0);
  const [followUpAlert, setFollowUpAlert] = useState<ClinicalAlert | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await alertsApi.count();
      setTotal(data.total);
      setAlerts(data.recent ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const visibleAlerts = alerts;

  if (visibleAlerts.length === 0) return null;

  return (
    <>
      <div className="alert-banner-container">
        {visibleAlerts.map(alert => (
          <div
            key={alert.id}
            className={`alert-banner alert-banner--${alert.severity.toLowerCase()}`}
            role="alert"
          >
            <div className="alert-banner__icon">
              {alert.severity === 'CRITICAL' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="alert-banner__content">
              <strong>{alert.alert_type_display}</strong>
              <span className="alert-banner__patient">
                {' '}— {alert.patient_name} ({alert.patient_number})
              </span>
              <span className="alert-banner__value">
                {' '}| Value: {alert.value_triggered}
              </span>
            </div>
            <button
              className="alert-banner__ack flex items-center gap-1"
              onClick={() => setFollowUpAlert(alert)}
              title="Follow up with mother"
            >
              <MessageSquare size={14} /> Follow Up
            </button>
          </div>
        ))}
        {total > visibleAlerts.length && (
          <div className="alert-banner__more">
            + {total - visibleAlerts.length} more pending alert{total - visibleAlerts.length !== 1 ? 's' : ''}
            <a href="/alerts" className="alert-banner__link">View All</a>
          </div>
        )}
      </div>

      <AlertFollowUpModal
        alert={followUpAlert}
        onClose={() => setFollowUpAlert(null)}
        onSuccess={fetchAlerts}
      />
    </>
  );
}
