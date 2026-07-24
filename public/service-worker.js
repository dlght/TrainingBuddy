// Minimal PWA service worker for the Metro/Expo Router web export.
// Static bundle files under /_expo/static/ are content-hashed by Metro, so they're
// safe to cache-first forever. Everything else (HTML shell, API calls) goes to the
// network first, falling back to cache only when offline.
const CACHE_NAME = "trainingbuddy-cache-v1";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isHashedStaticAsset = url.pathname.startsWith("/_expo/static/");

  if (isHashedStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.mode === "navigate") {
          caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone()));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request.mode === "navigate" ? "/" : request);
        if (cached) {
          return cached;
        }
        throw new Error("Network request failed and no cache entry available.");
      })
  );
});
