/**
 * frontend/src/components/RealtimeAlertToast.tsx
 * ─────────────────────────────────────────────────
 * Global floating toast that appears when a new realtime_clinical_alerts
 * row is inserted by the Django backend (e.g., high blood pressure,
 * fetal heart rate anomaly, patient symptom report).
 *
 * Positioned at the top-right of the viewport, auto-dismisses after 12s.
 * Only visible to authenticated staff (ADMIN, DOCTOR, NURSE).
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, X, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase, type RealtimeClinicalAlert } from '../context/SupabaseContext';
import { useAuth } from '../context/AuthContext';

const ALERT_AUTO_DISMISS_MS = 12000;

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  CRITICAL: {
    bg: 'rgba(220, 38, 38, 0.96)',
    border: '#dc2626',
    icon: '🚨',
    label: 'CRITICAL',
  },
  WARNING: {
    bg: 'rgba(217, 119, 6, 0.96)',
    border: '#d97706',
    icon: '⚠️',
    label: 'WARNING',
  },
};

export default function RealtimeAlertToast() {
  const { latestClinicalAlert, dismissClinicalAlert } = useSupabase();
  const { isAuthenticated, isMother } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<RealtimeClinicalAlert | null>(null);

  useEffect(() => {
    if (latestClinicalAlert) {
      setCurrentAlert(latestClinicalAlert);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissClinicalAlert, 400); // dismiss after fade-out
      }, ALERT_AUTO_DISMISS_MS);

      return () => clearTimeout(timer);
    }
  }, [latestClinicalAlert, dismissClinicalAlert]);

  // Mothers never see broadcast clinical alerts
  if (!isAuthenticated || isMother || !currentAlert || !visible) return null;

  const style = SEVERITY_STYLES[currentAlert.severity] ?? SEVERITY_STYLES.WARNING;

  const handleNavigateToPatient = () => {
    setVisible(false);
    dismissClinicalAlert();
    navigate(`/patients/${currentAlert.patient_id}`);
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(dismissClinicalAlert, 400);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 99999,
        minWidth: 340,
        maxWidth: 420,
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        color: '#fff',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.96)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{style.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', opacity: 0.9 }}>
            {style.label} ALERT
          </span>
          <Activity size={14} style={{ opacity: 0.7 }} />
        </div>
        <button
          id="rt-alert-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 6,
            padding: '2px 6px',
            cursor: 'pointer',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Alert message */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
          {currentAlert.message}
        </p>
      </div>

      {/* Alert meta */}
      <div style={{ fontSize: 11, opacity: 0.75, display: 'flex', gap: 12 }}>
        <span>Type: {currentAlert.alert_type.replace(/_/g, ' ')}</span>
        <span>
          {new Date(currentAlert.created_at).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Navigate to patient CTA */}
      <button
        id="rt-alert-view-patient-btn"
        onClick={handleNavigateToPatient}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 8,
          color: '#fff',
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)')}
      >
        View Patient Record
        <ChevronRight size={14} />
      </button>

      {/* Auto-dismiss progress bar */}
      <div
        style={{
          height: 3,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'rgba(255,255,255,0.75)',
            animation: `shrink-width ${ALERT_AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
