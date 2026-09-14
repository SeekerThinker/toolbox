const CACHE_NAME = "toolbox-shell-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./horizons.css",
  "./calibration.css",
  "./cloud.css",
  "./manifest.webmanifest",
  "./pwa-icon-192.svg",
  "./pwa-icon-512.svg",
  "./core.js",
  "./cloud-public.js",
  "./cloud-config.js",
  "./sync-policy.js",
  "./sync.js",
  "./account-lifecycle.js",
  "./cloud-diagnostics.js",
  "./tools-focus.js",
  "./tools-thinking.js",
  "./tasks.js",
  "./horizons.js",
  "./calibration.js",
  "./pwa.js",
  "./capture.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const networkFirst = async request => {
  try {
    const response = await fetch(request);
    if (response.ok && new URL(request.url).origin === self.location.origin) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match("./index.html");
    throw new Error("offline");
  }
};

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/cloud-public.js") ||
    url.pathname.endsWith("/cloud-config.js")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const refresh = fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || refresh;
    })
  );
});
