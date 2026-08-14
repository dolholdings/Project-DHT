// Dolphin PWA Service Worker
const CACHE_NAME = 'dolphin-portal-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first without breaking API, Firestore, or module scripts
self.addEventListener('fetch', (event) => {
  // Do not intercept non-GET requests or external APIs/Firestore
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }
});

