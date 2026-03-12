
/**
 * 🚀 SERVICE WORKER LK RAMOS - OFFLINE ENGINE
 * Este arquivo permite que a interface do sistema carregue sem internet.
 * Os dados (clientes/propostas) são gerenciados pelo cache interno do Firestore.
 */

const CACHE_NAME = 'lk-ramos-cache-v1.2';
const OFFLINE_URL = '/';

// Assets essenciais para o funcionamento básico
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de API e Firebase (Firestore tem seu próprio cache offline)
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.url.includes('google-analytics.com') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna do cache se existir, senão busca na rede
      return response || fetch(event.request).then((fetchResponse) => {
        // Cacheia novos assets estáticos (JS, CSS, Imagens) conforme são acessados
        if (
            event.request.method === 'GET' && 
            (event.request.url.includes('_next/static') || 
             event.request.url.includes('picsum.photos'))
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Se falhar (offline total) e for uma navegação, retorna a página inicial
      if (event.request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
    })
  );
});

// Listener para forçar atualização quando o usuário clica no botão de update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
