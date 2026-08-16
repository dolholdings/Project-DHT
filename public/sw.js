// Dolphin PWA Service Worker v3
const CACHE_NAME = 'dolphin-portal-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first without breaking API, Firestore, or module scripts
self.addEventListener('fetch', (event) => {
  // Pass through all requests natively
  return;
});


