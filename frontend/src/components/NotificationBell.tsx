/**
 * frontend/src/components/NotificationBell.tsx
 * ──────────────────────────────────────────────
 * Notification bell showing live counts from two sources:
 *
 *   1. Realtime count: from SupabaseContext (realtime_staff_notifications table)
 *      — pushed instantly when Django writes to Supabase via RealtimeService
 *
 *   2. Ticket count: fetched from Django REST API (polling fallback, 60s interval)
 *      — kept for backward compatibility with the ticket system
 *
 * The bell animates when new realtime notifications arrive.
 */
import { useEffect, useState, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api';
import { useSupabase } from '../context/SupabaseContext';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { realtimeNotifCount, realtimeNotifications } = useSupabase();

  // Polling count for Django notifications
  const [pollingNotifCount, setPollingNotifCount] = useState(0);

  // Combined total shown on the badge
  const totalCount = realtimeNotifCount + pollingNotifCount;

  // Track previous realtime count to detect NEW arrivals for animation
  const [prevRealtimeCount, setPrevRealtimeCount] = useState(realtimeNotifCount);
  const [ring, setRing] = useState(false);

  // Animate bell when a new realtime notification arrives
  useEffect(() => {
    if (realtimeNotifCount > prevRealtimeCount) {
      setRing(true);
      const t = setTimeout(() => setRing(false), 2000);
      setPrevRealtimeCount(realtimeNotifCount);
      return () => clearTimeout(t);
    }
    setPrevRealtimeCount(realtimeNotifCount);
  }, [realtimeNotifCount, prevRealtimeCount]);

  // Latest realtime notification for tooltip
  const latestNotif = realtimeNotifications[0];

  const loadNotifCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationsApi.unreadCount();
      setPollingNotifCount(data?.unread_count ?? 0);
    } catch {
      setPollingNotifCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifCount();
    // Reduced polling frequency since Realtime covers most notifications
    const interval = window.setInterval(loadNotifCount, 60000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadNotifCount]);

  const tooltipText = latestNotif
    ? `${latestNotif.title}: ${latestNotif.message}`
    : totalCount > 0
    ? `${totalCount} unread notification${totalCount > 1 ? 's' : ''}`
    : 'No new notifications';

  return (
    <button
      type="button"
      id="notification-bell-btn"
      className="btn btn-ghost"
      style={{ position: 'relative', minWidth: 40 }}
      onClick={() => navigate('/notifications')}
      title={tooltipText}
      aria-label={`Notifications — ${totalCount} unread`}
    >
      {/* Bell icon — rings when new realtime notification arrives */}
      <span
        style={{
          display: 'inline-flex',
          animation: ring ? 'bell-ring 0.5s ease-in-out 2' : 'none',
        }}
      >
        {totalCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
      </span>

      {/* Badge */}
      {totalCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: realtimeNotifCount > 0 ? '#7c3aed' : '#ef4444',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            padding: '0 5px',
            boxShadow: '0 0 0 2px var(--bg-card, #fff)',
            transition: 'background 0.3s',
          }}
        >
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}

      {/* CSS keyframes for bell animation */}
      <style>{`
        @keyframes bell-ring {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-15deg); }
          40%  { transform: rotate(15deg); }
          60%  { transform: rotate(-10deg); }
          80%  { transform: rotate(10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </button>
  );
}
