const CACHE_NAME = "toolbox-shell-v8";
const SHARE_CACHE = "toolbox-share-inbox-v1";
const SHARE_ENTRY = new URL("./__share_payload__", self.registration.scope).href;
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./horizons.css",
  "./calibration.css",
  "./readability.css",
  "./manifest.webmanifest",
  "./pwa-icon-192.svg",
  "./pwa-icon-512.svg",
  "./core.js",
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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key !== SHARE_CACHE).map(key => caches.delete(key))))
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

const cleanShared = value => String(value || "").replace(/\s+/g, " ").trim();

const receiveShare = async request => {
  const form = await request.formData();
  const values = [form.get("title"), form.get("text"), form.get("url")]
    .map(cleanShared)
    .filter(Boolean);
  const unique = values.filter((value, index) =>
    !values.some((other, otherIndex) => otherIndex < index && (other.includes(value) || value.includes(other)))
  );
  const shared = unique.join(" — ").slice(0, 3000);
  const inbox = await caches.open(SHARE_CACHE);
  if (shared) {
    await inbox.put(SHARE_ENTRY, new Response(shared, { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
  } else {
    await inbox.delete(SHARE_ENTRY);
  }
  return Response.redirect(new URL("./?capture=shared", self.registration.scope).href, 303);
};

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === "POST" && url.origin === self.location.origin && url.pathname.endsWith("/share-target")) {
    event.respondWith(receiveShare(request));
    return;
  }

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
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
