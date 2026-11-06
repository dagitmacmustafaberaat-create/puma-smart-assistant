const CACHE_NAME = "buyaka-puma-app-v78";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=20261106-sd-champions-layout-v1",
  "./performance-league.js?v=20261102-excel-source",
  "./top5-analysis.js?v=20261106-business-unit-filter-v1",
  "./script.js?v=20261102-hgo-percent",
  "./shift-program.js?v=20261105-shift-horizontal-v2",
  "./sd-karne.js?v=20261106-single-trophy-v1",
  "./education.js?v=20261106-inline-viewer-v1",
  "./Buyaka%20Puma%20%C5%9Eampiyonlar%20Kul%C3%BCb%C3%BC%20Kutlamas%C4%B1.png?v=20261106-champions-background",
  "./K%C4%B1rm%C4%B1z%C4%B1%20I%C5%9F%C4%B1kl%C4%B1%20Puma%20%C5%9Eampiyonluk%20Kupas%C4%B1.png?v=20261106-single-trophy",
  "./manifest.json",
  "./puma-bg.jpg.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("buyaka-puma-app-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache live stock data or training documents; always fetch them from the network.
  if (/data\.json$/i.test(url.pathname) || /performance-league\.json$/i.test(url.pathname) || /\.(pdf|docx|pptx|xlsx?)$/i.test(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      })
  );
});
