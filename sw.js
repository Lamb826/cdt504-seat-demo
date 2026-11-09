const CACHE_PREFIX = "cdt504-study-seat-";
const CACHE = CACHE_PREFIX + "2";
const ASSETS = [
  "index.html", "checkin.html", "seat-map.html", "base.css", "map.css",
  "app.js", "map.js", "floor-data.js", "config.js", "register.js", "manifest.json",
  "seat-plate.html", "plate.css", "plate.js",
  "icon-192.png", "icon-512.png",
  "floors/1f.webp", "floors/mf.webp", "floors/2f.webp", "floors/3f.webp",
];
const urls = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...urls])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  url.search = "";
  if (url.href === self.registration.scope) url.href = new URL("index.html", url).href;
  if (!urls.has(url.href)) return;
  // Keep query strings on navigations. All variants use the same static HTML.
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(url.href)) ?? Response.error();
  }));
});
