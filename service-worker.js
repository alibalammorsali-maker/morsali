const CACHE_NAME = 'rank-teacher-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './renderer.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isCore = CORE_ASSETS.some((asset) => new URL(asset, self.location).href === url.href);

  if (isCore) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Runtime caching for same-origin assets (e.g., help PDFs)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
