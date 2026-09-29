// The Color Code — service worker. Lets the installed app open offline and load fast.
// Pages come from the network first (so updates show right away) and fall back to cache.
var CACHE = 'tcc-v2';
var CORE = ['/', '/index.html', '/start-your-analysis.html', '/result.html', '/styles.css?v=3', '/site.js', '/analysis.js', '/palettes.js', '/config.js', '/supabase-client.js', '/account.html', '/account.js', '/manifest.json', '/assets/logo.png', '/assets/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.url.endsWith('.mov')) return;
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: false }); }));
});
