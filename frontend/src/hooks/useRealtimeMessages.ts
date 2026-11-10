/**
 * frontend/src/hooks/useRealtimeMessages.ts
 * ──────────────────────────────────────────
 * Subscribes to real-time patient messages for a specific patient ID.
 * Used on PatientDetail (staff) and MotherDashboard/MotherSymptoms (mother).
 *
 * When the Django backend's broadcast_secure_message_on_save signal fires,
 * it inserts a row into realtime_patient_messages via RealtimeService.
 * This hook receives that row instantly via Supabase CDC.
 *
 * Usage:
 *   const { messages, unreadCount, markAllRead } = useRealtimeMessages(patientId);
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabase, type RealtimePatientMessage } from '../context/SupabaseContext';

interface UseRealtimeMessagesResult {
  /** Live messages received since the component mounted */
  liveMessages: RealtimePatientMessage[];
  /** Count of unread messages in the live feed */
  unreadCount: number;
  /** Reset the unread count (e.g., when user opens the messages panel) */
  markAllRead: () => void;
  /** Whether we are currently subscribed */
  isSubscribed: boolean;
}

export function useRealtimeMessages(patientId: number | null | undefined): UseRealtimeMessagesResult {
  const { subscribeToPatientMessages } = useSupabase();
  const [liveMessages, setLiveMessages] = useState<RealtimePatientMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!patientId) return;

    setIsSubscribed(true);

    const unsubscribe = subscribeToPatientMessages(patientId, (message) => {
      setLiveMessages((prev) => [...prev, message]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [patientId, subscribeToPatientMessages]);

  return { liveMessages, unreadCount, markAllRead, isSubscribed };
}
