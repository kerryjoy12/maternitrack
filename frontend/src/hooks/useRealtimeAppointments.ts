/**
 * frontend/src/hooks/useRealtimeAppointments.ts
 * ────────────────────────────────────────────────
 * Subscribes to real-time appointment events from the
 * realtime_appointment_events Supabase table.
 *
 * The Django backend inserts rows whenever:
 *   - An appointment is marked attended / missed
 *   - An appointment is rescheduled
 *   - A new appointment is created
 *
 * The hook returns a flag `hasUpdates` that pages use to show a
 * "New updates available — refresh" banner, and an `events` array
 * for immediate UI updates.
 *
 * Usage:
 *   const { hasUpdates, latestEvent, clearUpdates } = useRealtimeAppointments();
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabase, type RealtimeAppointmentEvent } from '../context/SupabaseContext';

interface UseRealtimeAppointmentsResult {
  /** True when at least one appointment event has arrived since last clear */
  hasUpdates: boolean;
  /** The most recent appointment event received */
  latestEvent: RealtimeAppointmentEvent | null;
  /** All events since the component mounted (capped at 50) */
  events: RealtimeAppointmentEvent[];
  /** Call after re-fetching from API to reset the update indicator */
  clearUpdates: () => void;
}

export function useRealtimeAppointments(): UseRealtimeAppointmentsResult {
  const { subscribeToAppointmentEvents } = useSupabase();
  const [events, setEvents] = useState<RealtimeAppointmentEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RealtimeAppointmentEvent | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);

  const clearUpdates = useCallback(() => {
    setHasUpdates(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAppointmentEvents((event) => {
      setLatestEvent(event);
      setEvents((prev) => [event, ...prev].slice(0, 50));
      setHasUpdates(true);
    });

    return unsubscribe;
  }, [subscribeToAppointmentEvents]);

  return { hasUpdates, latestEvent, events, clearUpdates };
}
