/*
 * MaterniTrack Service Worker — Phase 2F
 *
 * Strategy:
 *   - Static assets (JS/CSS/images): Cache-first with network fallback
 *   - API calls: Network-first with cache fallback (read-only offline)
 *   - Offline: Shows cached data; banner notifies user of offline state
 */
const CACHE_NAME = 'maternitrack-v2';
const STATIC_CACHE = 'maternitrack-static-v2';
const API_CACHE = 'maternitrack-api-v2';

// Static assets to pre-cache on install
const PRE_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install ─────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(PRE_CACHE);
    })
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests → network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Static assets → cache-first
  event.respondWith(cacheFirstStatic(request));
});

// ── Network-first for API ───────────────────────────────────────────
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached API response:', request.url);
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'You are offline. This data is not available.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Push Notifications ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'MaterniTrack', {
      body: data.body || 'You have a new notification.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

// ── Periodic Background Sync — fires daily to check appointments ────────
// Registered from the app after notification permission is granted.
// On Android Chrome this wakes the SW once a day even when app is closed.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'appointment-reminders') {
    event.waitUntil(checkAppointmentReminders());
  }
});

// ── One-off Background Sync fallback ──────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'appointment-reminders') {
    event.waitUntil(checkAppointmentReminders());
  }
});

async function checkAppointmentReminders() {
  const token = await getStoredToken();
  if (!token) return;

  const notifEnabled = await getStoredItem('notif_enabled');
  if (notifEnabled === 'false') return;

  try {
    const res = await fetch('/api/v1/appointments/?status=UPCOMING&page_size=100', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const appointments = data.results ?? data;

    const firedRaw = await getStoredItem('appt_notif_fired');
    const fired = new Set(JSON.parse(firedRaw || '[]'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const appt of appointments) {
      const apptDate = new Date(appt.scheduled_date);
      apptDate.setHours(0, 0, 0, 0);
      const days = Math.round((apptDate - today) / (1000 * 60 * 60 * 24));

      const patientName = appt.patient_name || appt.patient?.full_name || 'Patient';
      const apptType = appt.appointment_type_display || appt.appointment_type || 'Appointment';
      const dateStr = apptDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

      const triggers = [
        { d: 3, label: '3 days' },
        { d: 2, label: '2 days' },
        { d: 1, label: 'tomorrow' },
        { d: 0, label: 'today' },
      ];

      for (const { d, label } of triggers) {
        if (days !== d) continue;
        const key = `appt-${appt.id}-${d}d`;
        if (fired.has(key)) continue;

        const title = d === 0 ? '📅 Appointment Today' : `⏰ Appointment in ${label}`;
        const body = d === 0
          ? `${patientName} has a ${apptType} appointment TODAY — ${dateStr}`
          : `Reminder: ${patientName}'s ${apptType} is in ${label} — ${dateStr}`;

        await self.registration.showNotification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: key,
          data: '/appointments',
        });

        fired.add(key);
      }
    }

    // Persist updated fired keys
    const arr = Array.from(fired).slice(-200);
    await setStoredItem('appt_notif_fired', JSON.stringify(arr));
  } catch (e) {
    console.warn('[SW] appointment reminder check failed:', e);
  }
}

// ── IndexedDB helpers for reading localStorage-equivalent in SW ────────
function getStoredToken() {
  return new Promise((resolve) => {
    const req = indexedDB.open('maternitrack-sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('kv');
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('kv', 'readonly');
      const get = tx.objectStore('kv').get('access_token');
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

function getStoredItem(key) {
  return new Promise((resolve) => {
    const req = indexedDB.open('maternitrack-sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('kv');
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('kv', 'readonly');
      const get = tx.objectStore('kv').get(key);
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

function setStoredItem(key, value) {
  return new Promise((resolve) => {
    const req = indexedDB.open('maternitrack-sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('kv');
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    req.onerror = () => resolve();
  });
}

// ── Cache-first for static ──────────────────────────────────────────
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // If it's a navigation request, return the cached index.html (SPA)
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}
