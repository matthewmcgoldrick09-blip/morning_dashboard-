const CACHE_NAME = "morning-brief-v1";
const CORE_ASSETS = [
  "/morning_dashboard-/",
  "/morning_dashboard-/index.html",
  "/morning_dashboard-/data/brief.json",
  "/morning_dashboard-/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for JSON (try fresh, fall back to cache)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle our own origin
  if (url.origin !== self.location.origin) return;

  // JSON: try network, fallback to cache
  if (url.pathname.endsWith("/data/brief.json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
