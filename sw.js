/* Kahera POS — sw.js
 * Offline support: cache the app shell on install, serve cache-first,
 * refresh the cache in the background. Bump CACHE when files change. */
const CACHE = 'kahera-v1.0.0';
const SHELL = [
  './', 'index.html', 'css/styles.css', 'js/money.js', 'js/store.js',
  'js/menu-sample.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
