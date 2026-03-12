/**
 * 🛡️ SERVICE WORKER LK RAMOS (PWA V1)
 * Responsável por tornar o app instalável e cachear assets fundamentais.
 */

const CACHE_NAME = 'lk-ramos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas para APIs e Firebase (que têm sua própria persistência)
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
