/**
 * frontend/src/hooks/useRealtimeNotifications.ts
 * ───────────────────────────────────────────────
 * Hook to access staff realtime notifications from SupabaseContext.
 *
 * Allows components to list realtime notifications and mark them as read.
 */
import { useSupabase, type RealtimeNotification } from '../context/SupabaseContext';

interface UseRealtimeNotificationsResult {
  notifications: RealtimeNotification[];
  unreadCount: number;
  // Note: markRead is done locally or via API if mirrored. Since we are doing it client-side
  // for realtime state, we can provide a dummy or helper if needed.
}

export function useRealtimeNotifications(): UseRealtimeNotificationsResult {
  const { realtimeNotifications, realtimeNotifCount } = useSupabase();

  return {
    notifications: realtimeNotifications,
    unreadCount: realtimeNotifCount,
  };
}
