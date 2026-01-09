const CACHE_NAME = 'portal-news-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';

// APIs externas que NUNCA devem ser cacheadas
const EXTERNAL_APIS = [
  'api.coingecko.com',
  'economia.awesomeapi.com.br',
  'api.open-meteo.com',
  'supabase.co',
  'supabase.in'
];

// Recursos essenciais para cache (apenas shell da app)
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico'
];

// Instalar Service Worker - força atualização imediata
self.addEventListener('install', (event) => {
  console.log('SW: Installing v2.0.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Força ativação imediata sem esperar
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== CACHE_NAME) {
            console.log('SW: Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Apenas interceptar requisições HTTP/HTTPS
  if (!request.url.startsWith('http')) return;

  // BYPASS TOTAL para APIs externas - NUNCA cachear
  if (EXTERNAL_APIS.some(api => url.hostname.includes(api))) {
    return; // Deixa o navegador fazer a requisição normalmente
  }

  // Bypass para streams de áudio
  if (request.destination === 'audio' || url.pathname.startsWith('/radio') || url.hostname.includes('streammaximum.com')) {
    return; // Deixa o navegador fazer a requisição normalmente
  }

  // Para navegação (páginas HTML), sempre buscar da rede primeiro
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Só usa cache se a rede falhar completamente
          return caches.match(request).then((cached) => {
            return cached || new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>Você está offline</h1><p>Verifique sua conexão e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // Para scripts e styles com hash (Vite gera com hash único), usar Network First
  // Isso garante que novas versões sejam sempre carregadas
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear para fallback offline
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Para imagens, usar Cache First (são estáticas)
  if (request.destination === 'image' || request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
        .catch(() => {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Imagem indisponível</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        })
    );
    return;
  }

  // Para outras requisições, tentar rede primeiro
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver notícia',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Portal de Notícias', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background Sync (para quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sincronizar dados pendentes quando voltar online
      syncPendingData()
    );
  }
});

function syncPendingData() {
  return new Promise((resolve) => {
    // Implementar sincronização de dados pendentes
    console.log('SW: Syncing pending data...');
    resolve();
  });
}