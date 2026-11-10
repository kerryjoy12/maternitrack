/**
 * frontend/src/context/SupabaseContext.tsx
 * ──────────────────────────────────────────
 * Centralised Realtime subscription manager using Server-Sent Events (SSE).
 *
 * This file replaces the Supabase client connection with a standard
 * EventSource connection to the Django backend. It preserves the exact
 * context interface (useSupabase) so that the change is transparent
 * to the rest of the React application.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RealtimeNotification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'INFO' | 'WARNING' | 'CRITICAL' | 'APPOINTMENT';
  patient_id: number | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface RealtimeClinicalAlert {
  id: number;
  alert_type: string;
  severity: 'WARNING' | 'CRITICAL';
  patient_id: number;
  message: string;
  recipient_roles: string[];
  acknowledged: boolean;
  created_at: string;
}

export interface RealtimePatientMessage {
  id: number;
  sender_id: string;
  recipient_id: string | null;
  patient_id: number;
  message: string;
  message_type: 'GENERAL' | 'CARE_ALERT';
  is_read: boolean;
  created_at: string;
}

export interface RealtimeAppointmentEvent {
  id: number;
  appointment_id: number;
  patient_id: number;
  new_status: string;
  scheduled_date: string;
  appointment_type: string;
  created_at: string;
}

interface SupabaseCtx {
  /** Mock session for backward compatibility */
  supabaseSession: any | null;
  /** No-op for compatibility */
  setSupabaseSession: (session: { access_token: string; refresh_token: string }) => Promise<void>;
  /** No-op for compatibility */
  supabaseSignOut: () => Promise<void>;
  /** Unread realtime notification count for the current user */
  realtimeNotifCount: number;
  /** Most recent realtime notifications (capped at 20) */
  realtimeNotifications: RealtimeNotification[];
  /** Most recent unacknowledged clinical alert broadcast (for toast) */
  latestClinicalAlert: RealtimeClinicalAlert | null;
  /** Dismiss the latest clinical alert toast */
  dismissClinicalAlert: () => void;
  /** Subscribe to messages for a specific patient — returns unsubscribe fn */
  subscribeToPatientMessages: (
    patientId: number,
    onMessage: (msg: RealtimePatientMessage) => void
  ) => () => void;
  /** Subscribe to appointment events — returns unsubscribe fn */
  subscribeToAppointmentEvents: (
    onEvent: (event: RealtimeAppointmentEvent) => void
  ) => () => void;
}

const SupabaseContext = createContext<SupabaseCtx>({} as SupabaseCtx);

// ── Provider ───────────────────────────────────────────────────────────────────

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [realtimeNotifications, setRealtimeNotifications] = useState<RealtimeNotification[]>([]);
  const [latestClinicalAlert, setLatestClinicalAlert] = useState<RealtimeClinicalAlert | null>(null);

  // Keep track of active listeners for message/appointment callbacks
  const patientListenersRef = useRef<Record<number, ((msg: RealtimePatientMessage) => void)[]>>({});
  const appointmentListenersRef = useRef<((event: RealtimeAppointmentEvent) => void)[]>([]);

  const realtimeNotifCount = realtimeNotifications.filter((n) => !n.is_read).length;

  const setSupabaseSession = useCallback(async () => {
    // No-op after migration
  }, []);

  const supabaseSignOut = useCallback(async () => {
    setRealtimeNotifications([]);
    setLatestClinicalAlert(null);
  }, []);

  // ── Server-Sent Events (SSE) Stream ─────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[SSE Realtime] No access token found in localStorage');
      return;
    }

    // Connect to Django's SSE endpoint (proxied automatically via Vite)
    const url = `/api/v1/core/realtime/stream/?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.info('[SSE Realtime] Connected to event stream');
    };

    eventSource.onerror = (err) => {
      console.error('[SSE Realtime] Connection error:', err);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event_type === 'ping') {
          return; // keep-alive ping
        }

        const { event_type, payload } = message;
        console.debug('[SSE Realtime] Event received:', event_type, payload);

        if (event_type === 'staff_notification') {
          const notif = payload as RealtimeNotification;
          setRealtimeNotifications((prev) => [notif, ...prev].slice(0, 20));

          // Browser notification for CRITICAL alerts
          if (
            notif.notification_type === 'CRITICAL' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`🚨 ${notif.title}`, { body: notif.message });
          }
        } 
        
        else if (event_type === 'clinical_alert') {
          const alert = payload as RealtimeClinicalAlert;
          if (alert.recipient_roles?.includes(user.role)) {
            setLatestClinicalAlert(alert);
          }
        } 
        
        else if (event_type === 'patient_message') {
          const msg = payload as RealtimePatientMessage;
          const listeners = patientListenersRef.current[msg.patient_id] || [];
          listeners.forEach((cb) => cb(msg));
        } 
        
        else if (event_type === 'appointment_event') {
          const evt = payload as RealtimeAppointmentEvent;
          appointmentListenersRef.current.forEach((cb) => cb(evt));
        }
      } catch (err) {
        console.warn('[SSE Realtime] Failed to parse message event:', err);
      }
    };

    return () => {
      console.info('[SSE Realtime] Closing event stream');
      eventSource.close();
    };
  }, [isAuthenticated, user]);

  // ── Subscription Helpers ───────────────────────────────────────────────────

  const subscribeToPatientMessages = useCallback(
    (patientId: number, onMessage: (msg: RealtimePatientMessage) => void) => {
      if (!patientListenersRef.current[patientId]) {
        patientListenersRef.current[patientId] = [];
      }
      patientListenersRef.current[patientId].push(onMessage);

      // Return unsubscribe cleanup function
      return () => {
        const list = patientListenersRef.current[patientId] || [];
        patientListenersRef.current[patientId] = list.filter((cb) => cb !== onMessage);
      };
    },
    []
  );

  const subscribeToAppointmentEvents = useCallback(
    (onEvent: (event: RealtimeAppointmentEvent) => void) => {
      appointmentListenersRef.current.push(onEvent);

      // Return unsubscribe cleanup function
      return () => {
        appointmentListenersRef.current = appointmentListenersRef.current.filter((cb) => cb !== onEvent);
      };
    },
    []
  );

  const dismissClinicalAlert = useCallback(() => {
    setLatestClinicalAlert(null);
  }, []);

  return (
    <SupabaseContext.Provider
      value={{
        supabaseSession: null,
        setSupabaseSession,
        supabaseSignOut,
        realtimeNotifCount,
        realtimeNotifications,
        latestClinicalAlert,
        dismissClinicalAlert,
        subscribeToPatientMessages,
        subscribeToAppointmentEvents,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);
