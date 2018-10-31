declare var self: ServiceWorkerGlobalScope;
declare var BUILD_ASSETS: string[];
// This seems to be required to put TypeScript into module mode *shrugs*
export type dummy = '';

console.log('hello from sw', BUILD_ASSETS);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  return; // Just returning for now, until I figure out what to cache.
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
