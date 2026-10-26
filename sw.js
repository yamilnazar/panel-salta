// Solo guarda los archivos propios del panel (no los datos de las APIs).
// Primero intenta la red; si no hay conexión, usa la copia guardada.
var CACHE = "panel-salta-v5";
var ARCHIVOS = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "icon.svg", "fonts/manrope-latin.woff2"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request, { cache: "no-store" })
      .then(function (r) {
        var copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
        return r;
      })
      .catch(function () {
        return caches.match(e.request, { ignoreSearch: true }).then(function (r) {
          return r || caches.match("index.html");
        });
      })
  );
});
