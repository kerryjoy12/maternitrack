import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { ClinicalAlert } from '../types';
import { alertsApi } from '../api';

interface AlertFollowUpModalProps {
  alert: ClinicalAlert | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AlertFollowUpModal({ alert, onClose, onSuccess }: AlertFollowUpModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message for the mother.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await alertsApi.followUp(alert.id, message.trim());
      setMessage('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send follow-up message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 520, padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} className="text-primary" />
              Follow Up with Mother
            </h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {alert.patient_name} ({alert.patient_number})
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            marginBottom: 16,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{alert.alert_type_display}</strong>
          <div style={{ marginTop: 8 }}>{alert.message}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
            Message to mother
          </label>
          <textarea
            className="form-input"
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Please come to the hospital today for review. Bring your ANC card."
            style={{ width: '100%', resize: 'vertical', marginBottom: 12 }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Sending...' : 'Send to Mother'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
