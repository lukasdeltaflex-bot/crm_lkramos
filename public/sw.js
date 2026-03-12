const CACHE_NAME = 'lk-ramos-v1.2';
const STATIC_ASSETS = [
  '/offline',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap'
];

// Instalação: Cache básico de segurança
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🛡️ REGRA 1: Firebase e API devem ser SEMPRE NetworkFirst (Nunca cachear dados dinâmicos)
  if (url.origin.includes('firestore') || url.origin.includes('firebase') || url.pathname.startsWith('/api')) {
    return; // Deixa o navegador/Firebase SDK lidar nativamente
  }

  // 🛡️ REGRA 2: Navegação de Páginas (HTML) - NetworkFirst
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline') || caches.match('/');
      })
    );
    return;
  }

  // 🛡️ REGRA 3: Assets Estáticos (Imagens, Fonts, Scripts) - StaleWhileRevalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Escuta sinal de atualização forçada
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
