// Crash The Stack's versioned, waiting-worker pattern, scoped to Harkfell.
// The build generates the complete shell; staging rewrites the R2 wasm path.
const VERSION = "__VERSION__";
const CACHE = "harkfell-play-" + VERSION;
const SHELL = __SHELL__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) =>
    Promise.all(SHELL.map((path) => cache.add(new Request(path, { cache: "reload" }))))));
  // Wait for the player's reload choice. Never interrupt play.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names
    .filter((name) => name.startsWith("harkfell-play-") && name !== CACHE)
    .map((name) => caches.delete(name))))
    .then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "VERSION" && event.ports[0]) {
    event.ports[0].postMessage({ version: VERSION });
  }
});

function isolated(response) {
  if (!response || response.status === 0) return response;
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Analytics and the site's uncached version check stay on the network.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(request.mode === "navigate" ? "./" : request,
      { ignoreSearch: true });
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await cache.put(request, response.clone());
    return response;
  }).then(isolated));
});
