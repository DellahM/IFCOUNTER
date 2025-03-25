const CACHE_NAME = 'if-counter-v2';
const ASSETS = [
  '/IFCOUNTER/',
  '/IFCOUNTER/index.html',
  '/IFCOUNTER/styles.css',
  '/IFCOUNTER/script.js',
  '/IFCOUNTER/manifest.json',
  '/IFCOUNTER/icons/icon-192.png',
  '/IFCOUNTER/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});