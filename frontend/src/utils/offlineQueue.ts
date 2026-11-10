import api from '../api';
import { sqliteDB } from './sqliteStorage';

export interface QueuedRequest {
  id: string;
  url: string;
  data: any;
  type: 'Patient Registration' | 'Appointment' | 'ANC Visit';
  timestamp: number;
}

let inMemoryQueue: QueuedRequest[] = [];

// Initialize SQLite table and load queued requests on load
export async function initOfflineQueue(): Promise<void> {
  try {
    await sqliteDB.init();
    await sqliteDB.exec('CREATE TABLE IF NOT EXISTS offline_queue (id TEXT PRIMARY KEY, url TEXT, data TEXT, type TEXT, timestamp INTEGER)');
    const res = await sqliteDB.exec('SELECT * FROM offline_queue ORDER BY timestamp ASC');
    if (res && res[0] && res[0].values) {
      inMemoryQueue = res[0].values.map((val: any[]) => ({
        id: val[0],
        url: val[1],
        data: JSON.parse(val[2]),
        type: val[3],
        timestamp: val[4]
      }));
    }
    window.dispatchEvent(new Event('offline-queue-changed'));
  } catch (err) {
    console.error('[SQLite] Failed to initialize offline queue database:', err);
  }
}

// Auto-run on import
initOfflineQueue();

export function getOfflineQueue(): QueuedRequest[] {
  return inMemoryQueue;
}

export function addToOfflineQueue(url: string, data: any) {
  let type: 'Patient Registration' | 'Appointment' | 'ANC Visit' = 'Patient Registration';
  if (url.includes('/appointments/')) {
    type = 'Appointment';
  } else if (url.includes('/clinical/anc-visits/')) {
    type = 'ANC Visit';
  }

  const id = Date.now() + Math.random().toString(36).substr(2, 9);
  const timestamp = Date.now();
  const newItem: QueuedRequest = {
    id,
    url,
    data,
    type,
    timestamp,
  };

  inMemoryQueue.push(newItem);
  window.dispatchEvent(new Event('offline-queue-changed'));

  // Persist asynchronously to local SQLite DB
  sqliteDB.exec(
    'INSERT INTO offline_queue (id, url, data, type, timestamp) VALUES (?, ?, ?, ?, ?)',
    [id, url, JSON.stringify(data), type, timestamp]
  ).catch(err => {
    console.error('[SQLite] Failed to insert offline record:', err);
  });
}

export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  // Query SQLite to make sure we sync the actual persisted state
  let queue: QueuedRequest[] = [];
  try {
    const res = await sqliteDB.exec('SELECT * FROM offline_queue ORDER BY timestamp ASC');
    if (res && res[0] && res[0].values) {
      queue = res[0].values.map((val: any[]) => ({
        id: val[0],
        url: val[1],
        data: JSON.parse(val[2]),
        type: val[3],
        timestamp: val[4]
      }));
    }
  } catch (err) {
    console.error('[SQLite] Failed to load offline queue for sync:', err);
    queue = [...inMemoryQueue];
  }

  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await api.post(item.url, item.data);
      success++;

      // Delete from SQLite database
      await sqliteDB.exec('DELETE FROM offline_queue WHERE id = ?', [item.id]);

      // Remove from memory cache
      inMemoryQueue = inMemoryQueue.filter(x => x.id !== item.id);
      window.dispatchEvent(new Event('offline-queue-changed'));
    } catch (err: any) {
      console.error('[SQLite] Failed to sync offline item:', item, err);
      // Discard invalid request (400-499) to prevent blocking the queue
      if (err && err.response && err.response.status >= 400 && err.response.status < 500) {
        failed++;
        await sqliteDB.exec('DELETE FROM offline_queue WHERE id = ?', [item.id]);
        inMemoryQueue = inMemoryQueue.filter(x => x.id !== item.id);
        window.dispatchEvent(new Event('offline-queue-changed'));
      } else {
        // Halt queue processing to preserve chronological insertion order
        break;
      }
    }
  }

  return { success, failed };
}

