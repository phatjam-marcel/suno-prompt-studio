const CACHE_NAME = "mn-prompt-studio-v2";

const ASSETS = [
  "/mn-prompt-studio/",
  "/mn-prompt-studio/index.html",
  "/mn-prompt-studio/manifest.json",
  "/mn-prompt-studio/icon-192.png",
  "/mn-prompt-studio/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.log("Cache install error:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  if (
    url.includes("api.anthropic.com") ||
    url.includes("googleapis.com") ||
    url.includes("groq.com") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com") ||
    url.includes("cdnjs.cloudflare.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === "document") {
          return caches.match("/mn-prompt-studio/index.html");
        }
      });
    })
  );
});
