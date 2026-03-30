// ⬇️ CAMBIA QUESTO NUMERO AD OGNI AGGIORNAMENTO (v1, v2, v3...)
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'smartspesa-' + CACHE_VERSION;

const urlsToCache = [
  '/spesa/',
  '/spesa/index.html',
  '/spesa/manifest.json'
];

// INSTALLAZIONE - mette in cache i file
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// ATTIVAZIONE - elimina vecchie cache e prende controllo subito
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('smartspesa-') && name !== CACHE_NAME)
          .map(name => caches.delete(name)) // cancella le versioni vecchie
      );
    }).then(() => self.clients.claim()) // prende controllo di tutte le tab aperte
  );
});

// FETCH - network first: prova sempre la rete, usa cache solo se offline
self.addEventListener('fetch', event => {
  // ignora richieste non GET e Firebase/API esterne
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.origin.includes(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // aggiorna la cache con la risposta fresca
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // offline: usa la cache
        return caches.match(event.request);
      })
  );
});
