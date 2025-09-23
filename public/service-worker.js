const urlSelf = new URL(self.location.href);
const BUILD_ID = urlSelf.searchParams.get('v') || 'dev';
const VERSION = `v-${BUILD_ID}`;
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/logo-192x192.png",
  "/icons/logo-512x512.png",
  "/icons/logo-180x180.png"
];

// Your API base
const API_ORIGIN = "https://tasksmate-fdfsarhnf5gacfb7.eastus-01.azurewebsites.net";
const API_PATH_PREFIX = "/v1";

// Install — precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  // Controlled activation; the app will trigger SKIP_WAITING on user confirm
  // self.skipWaiting();
});

// Activate — clean old caches + enable navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
      }));
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
  self.clients.claim();
});

// Allow app to trigger activation and warm caches
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "WARM_CACHE" && Array.isArray(event.data.assets)) {
    event.waitUntil((async () => {
      const cache = await caches.open(STATIC_CACHE);
      for (const url of event.data.assets) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok && res.type !== "opaque") await cache.put(url, res.clone());
        } catch {}
      }
    })());
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // SPA navigation fallback (use navigation preload if available)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        return await fetch(req);
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        const shell = await cache.match("/index.html");
        if (shell) return shell;
        const offline = await cache.match("/offline.html");
        if (offline) return offline;
        return new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
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
    if (fresh && fresh.status === 200 && fresh.type !== "opaque") {
      await putWithLimit(cache, req, fresh.clone());
    }
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
  const networkPromise = fetch(req).then(async (res) => {
    if (res && res.status === 200 && res.type !== "opaque") {
      await putWithLimit(cache, req, res.clone());
    }
    return res;
  }).catch(() => null);
  return cached || networkPromise;
}

async function putWithLimit(cache, req, res, max = 200) {
  await cache.put(req, res);
  const keys = await cache.keys();
  if (keys.length > max) await cache.delete(keys[0]);
}
