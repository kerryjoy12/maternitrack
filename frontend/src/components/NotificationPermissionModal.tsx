import React, { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

export default function NotificationPermissionModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if browser supports notifications and permission hasn't been decided yet
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const dismissed = localStorage.getItem('notif_prompt_dismissed');
    if (dismissed) return;
    // Small delay so it doesn't pop up instantly on login
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('MaterniTrack', {
        body: 'Notifications enabled! You will receive clinical alerts.',
        icon: '/favicon.png',
      });
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notif_prompt_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '24px 28px', maxWidth: 360, width: '90vw',
        animation: 'slideUp 0.3s ease',
      }}
    >
      <button
        onClick={handleDismiss}
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          background: 'var(--primary)', borderRadius: '50%',
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Bell size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Enable Notifications</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Stay updated on clinical alerts</div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
        Allow <strong>MaterniTrack</strong> to send you notifications for critical patient alerts, appointment reminders, and urgent clinical updates.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAllow}>
          <Bell size={15} style={{ marginRight: 6 }} /> Allow Notifications
        </button>
        <button className="btn btn-ghost" onClick={handleDismiss} title="Not now">
          <BellOff size={15} />
        </button>
      </div>
    </div>
  );
}
