const CACHE_NAME = 'if-counter-v3';
const RUNTIME_CACHE = 'runtime-cache';
const ASSETS = [
  '/IF-Counter/',
  '/IF-Counter/index.html',
  '/IF-Counter/styles.css',
  '/IF-Counter/script.js',
  '/IF-Counter/manifest.json',
  '/IF-Counter/icons/icon-192.png',
  '/IF-Counter/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE (Clean old caches) =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== RUNTIME_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// ===== FETCH (Cache-first with network fallback) =====
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache API responses
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Static assets
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetch(event.request))
    );
  }
});

// ===== BACKGROUND SYNC =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(
      // Replace with your actual sync logic
      console.log('Background sync for notes completed!')
    );
  }
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Time to check your fasting progress!',
    icon: '/IF-Counter/icons/icon-192.png',
    badge: '/IF-Counter/icons/icon-72.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Fasting Reminder', options)
  );
});