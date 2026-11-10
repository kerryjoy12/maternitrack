import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../api';

const STORAGE_KEY = 'appt_notif_fired';

function getDaysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(dateStr);
  apptDate.setHours(0, 0, 0, 0);
  return Math.round((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getFiredKeys(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markFired(key: string) {
  const keys = getFiredKeys();
  keys.add(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(keys).slice(-200)));
}

function fireNotification(title: string, body: string, tag: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (localStorage.getItem('notif_enabled') === 'false') return;

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag,
        data: '/appointments',
      } as NotificationOptions);
    });
  } else {
    new Notification(title, { body, icon: '/favicon.png' });
  }
}

// Sync token + notif_enabled to IndexedDB so the service worker can read them
function syncToIndexedDB(key: string, value: string) {
  if (!('indexedDB' in window)) return;
  const req = indexedDB.open('maternitrack-sw', 1);
  req.onupgradeneeded = (e: any) => e.target.result.createObjectStore('kv');
  req.onsuccess = (e: any) => {
    const db = e.target.result;
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
  };
}

// Register periodic background sync so SW checks appointments daily on mobile
async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    // @ts-ignore — periodicSync is not in all TS types yet
    if ('periodicSync' in reg) {
      // @ts-ignore
      await reg.periodicSync.register('appointment-reminders', { minInterval: 24 * 60 * 60 * 1000 });
    }
    // Fallback: one-off sync for browsers that support it
    if ('sync' in reg) {
      // @ts-ignore
      await reg.sync.register('appointment-reminders');
    }
  } catch {
    // Not supported on this browser — foreground-only mode
  }
}

export function useAppointmentReminders() {
  const { isAuthenticated } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Always sync the latest token to IndexedDB for the service worker
    const token = localStorage.getItem('access_token');
    if (token) syncToIndexedDB('access_token', token);
    syncToIndexedDB('notif_enabled', localStorage.getItem('notif_enabled') ?? 'true');

    // Register background sync (works even when app is closed on Android)
    registerPeriodicSync();

    if (ranRef.current) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (localStorage.getItem('notif_enabled') === 'false') return;

    ranRef.current = true;

    appointmentsApi.list({ status: 'UPCOMING', page_size: '100' }).then(({ data }: { data: any }) => {
      const appointments = data.results ?? data;
      const fired = getFiredKeys();

      appointments.forEach((appt: any) => {
        const days = getDaysDiff(appt.scheduled_date);
        const patientName = appt.patient_name || appt.patient?.full_name || 'Patient';
        const apptType = appt.appointment_type_display || appt.appointment_type || 'Appointment';
        const dateStr = new Date(appt.scheduled_date).toLocaleDateString('en-KE', {
          weekday: 'long', day: 'numeric', month: 'long',
        });

        const triggers = [
          { d: 3, label: '3 days' },
          { d: 2, label: '2 days' },
          { d: 1, label: 'tomorrow' },
          { d: 0, label: 'today' },
        ];

        triggers.forEach(({ d, label }) => {
          if (days !== d) return;
          const key = `appt-${appt.id}-${d}d`;
          if (fired.has(key)) return;

          const title = d === 0 ? '📅 Appointment Today' : `⏰ Appointment in ${label}`;
          const body = d === 0
            ? `${patientName} has a ${apptType} appointment TODAY — ${dateStr}`
            : `Reminder: ${patientName}'s ${apptType} is in ${label} — ${dateStr}`;

          fireNotification(title, body, key);
          markFired(key);
        });
      });
    }).catch(() => {});
  }, [isAuthenticated]);
}
