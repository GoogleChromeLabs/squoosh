/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="WebWorker" />
declare var self: ServiceWorkerGlobalScope;
declare var BUILD_ASSETS: string[];

console.log('hello from sw', BUILD_ASSETS);

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(async function () {
    const cache = await caches.open('v1');
    await cache.addAll(BUILD_ASSETS);
  }());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  event.respondWith(async function () {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
  }());
});

export default null;
