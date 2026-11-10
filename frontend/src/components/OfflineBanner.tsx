import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * OfflineBanner
 * ─────────────
 * Detects when the browser goes offline and shows a non-intrusive
 * notification banner. Auto-dismisses 2s after coming back online.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnect, setShowReconnect] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const updateQueueCount = async () => {
      const { getOfflineQueue } = await import('../utils/offlineQueue');
      setQueueCount(getOfflineQueue().length);
    };

    updateQueueCount();
    window.addEventListener('offline-queue-changed', updateQueueCount);
    return () => {
      window.removeEventListener('offline-queue-changed', updateQueueCount);
    };
  }, []);

  useEffect(() => {
    const performSync = async () => {
      try {
        const { syncOfflineQueue } = await import('../utils/offlineQueue');
        await syncOfflineQueue();
      } catch (err) {
        console.error('[OfflineBanner] Error syncing offline queue:', err);
      }
    };

    // Auto-sync on mount if online
    if (navigator.onLine) {
      performSync();
    }

    const handleOnline = () => {
      setOffline(false);
      setShowReconnect(true);
      performSync();
      setTimeout(() => setShowReconnect(false), 3000);
    };
    const handleOffline = () => {
      setOffline(true);
      setShowReconnect(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline && !showReconnect) return null;

  return (
    <div
      className={`offline-banner ${offline ? 'offline-banner--offline' : 'offline-banner--online'}`}
      role="status"
      aria-live="polite"
    >
      {offline ? (
        <>
          <span className="offline-banner__icon"><WifiOff size={16} /></span>
          <span>
            You are offline (SQLite active) — viewing cached data. 
            {queueCount > 0 ? ` ${queueCount} pending changes will sync when online.` : ' Changes will sync when reconnected.'}
          </span>
        </>
      ) : (
        <>
          <span className="offline-banner__icon"><Wifi size={16} /></span>
          <span>Back online — data synced successfully.</span>
        </>
      )}
    </div>
  );
}
