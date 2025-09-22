const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/logo-192x192.png",
  "/icons/logo-512x512.png"
];

// Your API base
const API_ORIGIN = "https://tasksmate-fdfsarhnf5gacfb7.eastus-01.azurewebsites.net";
const API_PATH_PREFIX = "/v1";

// Install — precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // SPA navigation fallback
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return cache.match("/index.html");
      }
    })());
    return;
  }

  // API requests — network-first
  if (url.origin === API_ORIGIN && url.pathname.startsWith(API_PATH_PREFIX)) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // Everything else (static/assets) — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || networkPromise;
}
