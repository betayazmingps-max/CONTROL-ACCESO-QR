const CACHE = "acceso-qr-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Never cache calls to the Apps Script backend — always go live.
  if (e.request.url.includes("script.google.com")) return;
  // Antes esto servía SIEMPRE lo que ya tenía guardado (y actualizaba el
  // caché recién para la SIGUIENTE visita) — por eso ni el hard-refresh ni
  // borrar caché del navegador servían para ver cambios nuevos, porque el
  // service worker se los saltaba. Ahora intenta la red primero; el caché
  // guardado solo se usa si de verdad no hay internet.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
