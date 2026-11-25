// Keeps a copy of the game so it opens without internet once it has been visited.
// Always tries the network first, so new versions show up as soon as you're online.
const CACHE = "border-hop-v9";
const FILES = ["./", "./index.html", "./legacy.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
    event.respondWith(
        // "no-cache" = always ask the server for the newest version instead of a copy saved by the browser
        fetch(request, { cache: "no-cache" })
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() =>
                caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match("./index.html"))
            )
    );
});
