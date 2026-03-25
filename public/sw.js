
/**
 * 🚀 SERVICE WORKER LK RAMOS - OFFLINE ENGINE
 * Este arquivo permite que a interface do sistema carregue sem internet.
 * Os dados (clientes/propostas) são gerenciados pelo cache interno do Firestore.
 */

const CACHE_NAME = 'lk-ramos-cache-v1.3';
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
  // Removido self.skipWaiting() automático.
  // Devemos aguardar o usuário clicar em "Atualizar Agora" para enviar a mensagem SKIP_WAITING.
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

  const isHtml = (event.request.headers.get('accept') || '').includes('text/html');
  const isRSC = event.request.headers.has('RSC') || event.request.url.includes('_rsc=');

  // Network First para navegação (HTML) e payloads do Next.js App Router (RSC)
  if (event.request.mode === 'navigate' || isHtml || isRSC) {
    event.respondWith(
      fetch(event.request).then((response) => {
        console.log(`[SW Flow] 🟢 Network First (Success): ${event.request.url}`);
        return caches.open(CACHE_NAME).then((cache) => {
          // Apenas faz cache da navegação HTML pura, não sujamos o cache com payloads RSC
          if (!isRSC) {
              cache.put(event.request, response.clone());
          }
          return response;
        });
      }).catch((err) => {
        console.warn(`[SW Flow] 🔴 Network First (Failed, falling back to cache): ${event.request.url}`, err);
        return caches.match(event.request).then((response) => {
          return response || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Cache First para o restante (CSS, JS, Imagens, etc)
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
    })
  );
});

// Listener para forçar atualização quando o usuário clica no botão de update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
