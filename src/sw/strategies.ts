export function cacheOrNetwork(event: FetchEvent): void {
  event.respondWith(async function () {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || fetch(event.request);
  }());
}

export function cacheOrNetworkAndCache(event: FetchEvent, cacheName: string): void {
  event.respondWith(async function () {
    const { request } = event;
    // Return from cache if possible.
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Else go to the network.
    const response = await fetch(request);
    const responseToCache = response.clone();

    event.waitUntil(async function () {
      // Cache what we fetched.
      const cache = await caches.open(cacheName);
      await cache.put(request, responseToCache);
    }());

    // Return the network response.
    return response;
  }());
}

export function cleanupCache(event: FetchEvent, cacheName: string, keepAssets: string[]) {
  event.waitUntil(async function () {
    const cache = await caches.open(cacheName);

    // Clean old entries from the dynamic cache.
    const requests = await cache.keys();
    const promises = requests.map((cachedRequest) => {
      // Get pathname without leading /
      const assetPath = new URL(cachedRequest.url).pathname.slice(1);
      // If it isn't one of our keepAssets, we don't need it anymore.
      if (!keepAssets.includes(assetPath)) return cache.delete(cachedRequest);
    });

    await Promise.all<any>(promises);
  }());
}
