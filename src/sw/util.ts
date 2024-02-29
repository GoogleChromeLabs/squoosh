import { initial, theRest } from './to-cache';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

export function cacheOrNetwork(event: FetchEvent): void {
  event.respondWith(
    (async function () {
      const cachedResponse = await caches.match(event.request, {
        ignoreSearch: true,
      });
      return cachedResponse || fetch(event.request);
    })(),
  );
}

export function cacheOrNetworkAndCache(
  event: FetchEvent,
  cacheName: string,
): void {
  event.respondWith(
    (async function () {
      const { request } = event;
      // Return from cache if possible.
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      // Else go to the network.
      const response = await fetch(request);
      const responseToCache = response.clone();

      event.waitUntil(
        (async function () {
          // Cache what we fetched.
          const cache = await caches.open(cacheName);
          await cache.put(request, responseToCache);
        })(),
      );

      // Return the network response.
      return response;
    })(),
  );
}

export function serveShareTarget(event: FetchEvent): void {
  const dataPromise = event.request.formData();

  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect('/?share-target'));

  event.waitUntil(
    (async function () {
      // The page sends this message to tell the service worker it's ready to receive the file.
      await nextMessage('share-ready');
      const client = await self.clients.get(event.resultingClientId);
      const data = await dataPromise;
      const file = data.get('file');
      client!.postMessage({ file, action: 'load-image' });
    })(),
  );
}

export function cleanupCache(
  event: FetchEvent,
  cacheName: string,
  keepAssets: string[],
) {
  event.waitUntil(
    (async function () {
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
    })(),
  );
}

function urlsToRequests(urls: string[]): Request[] {
  // Using no-cache, as our hashing aren't updating properly right now.
  return urls.map((url) => new Request(url, { cache: 'no-cache' }));
}

export async function cacheBasics(cacheName: string) {
  const cache = await caches.open(cacheName);
  return cache.addAll(urlsToRequests(initial));
}

export async function cacheAdditionalProcessors(cacheName: string) {
  const cache = await caches.open(cacheName);
  return cache.addAll(urlsToRequests(await theRest));
}

const nextMessageResolveMap = new Map<string, (() => void)[]>();

/**
 * Wait on a message with a particular event.data value.
 *
 * @param dataVal The event.data value.
 */
function nextMessage(dataVal: string): Promise<void> {
  return new Promise((resolve) => {
    if (!nextMessageResolveMap.has(dataVal)) {
      nextMessageResolveMap.set(dataVal, []);
    }
    nextMessageResolveMap.get(dataVal)!.push(resolve);
  });
}

self.addEventListener('message', (event) => {
  const resolvers = nextMessageResolveMap.get(event.data);
  if (!resolvers) return;
  nextMessageResolveMap.delete(event.data);
  for (const resolve of resolvers) resolve();
});
