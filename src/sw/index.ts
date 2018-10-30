declare var BUILD_ASSETS: string[];

console.log('hello from sw', BUILD_ASSETS);

addEventListener('install', (e: any) => {
  e.waitUntil(
    caches.open('v1')
      .then(cache => cache.addAll(BUILD_ASSETS))
      .then((self as any).skipWaiting()),
  );
});

addEventListener('activate', () => {
  (self as any as ServiceWorkerGlobalScope).clients.claim();
});

addEventListener('fetch', (e: Event) => {
  const request = (e as FetchEvent).request;
  (e as FetchEvent).respondWith(
    caches.match(request).then(res => res || fetch(request).then(res =>
      caches.open('v1')
        .then(cache => (cache.put(request, res.clone()), res.clone())),
    )),
  );
});
