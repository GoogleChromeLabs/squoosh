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

/** Whether a request is an exact, own-origin, full BEN2 asset GET. */
export function isCanonicalBen2Request(request: Request): boolean {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.search === '' &&
    !request.headers.has('range')
  );
}

/** Whether a response is safe to persist as an immutable BEN2 asset. */
export function isAdmissibleBen2Response(response: Response): boolean {
  return response.type !== 'opaque' && response.status === 200;
}

/**
 * BEN2 assets are immutable, lazy dependencies. Keep their cache contract
 * deliberately narrower than the legacy general cache helper: only an exact
 * canonical full GET may read/write the current versioned static cache.
 */
export function cacheBen2Asset(event: FetchEvent, cacheName: string): void {
  event.respondWith(
    (async function () {
      const { request } = event;

      // A query or Range request must always reach the origin. In particular,
      // it must neither consume nor replace the canonical full response.
      if (!isCanonicalBen2Request(request)) return fetch(request);

      // Do not use caches.match(): BEN2 must not read an old/unrelated cache.
      const cacheNames = await caches.keys();
      if (cacheNames.includes(cacheName)) {
        const cached = await (await caches.open(cacheName)).match(request);
        if (cached) return cached;
      }

      const response = await fetch(request);
      // Cache Storage accepts partial and opaque responses, but neither is a
      // valid offline copy of these exact immutable assets.
      if (isAdmissibleBen2Response(response)) {
        // Clone before handing the original to the response consumer. A clone
        // failure is cache-side-only, so it must not disrupt inference.
        let responseToCache: Response;
        try {
          responseToCache = response.clone();
        } catch {
          return response;
        }
        // Cache Storage consumes the clone atomically; rejected/truncated body
        // reads and quota errors leave no accepted write and remain non-fatal.
        const cacheWrite = caches
          .open(cacheName)
          .then((cache) => cache.put(request, responseToCache));
        event.waitUntil(cacheWrite.catch(() => undefined));
      }
      return response;
    })(),
  );
}

/** Serve the model only when it is already in the exact current cache. */
export function serveBen2ModelFromCache(
  event: FetchEvent,
  cacheName: string,
): void {
  event.respondWith(
    (async () => {
      const { request } = event;
      if (!isCanonicalBen2Request(request)) {
        return new Response('Invalid BEN2 model request', { status: 400 });
      }
      const cached = await caches.match(request, { cacheName });
      return (
        cached || new Response('BEN2 model is not cached', { status: 404 })
      );
    })(),
  );
}

/** Download and completely persist the SW inventory's current BEN2 model. */
export async function downloadBen2Model(
  path: string,
  cacheName: string,
): Promise<void> {
  const request = new Request(new URL(path, self.location.origin).href);
  if (!isCanonicalBen2Request(request)) {
    throw new Error('Invalid BEN2 model inventory entry');
  }
  if (await caches.match(request, { cacheName })) return;

  const response = await fetch(request);
  if (!isAdmissibleBen2Response(response)) {
    throw new Error('BEN2 model response was not accepted');
  }
  const responseToCache = response.clone();
  let cache: Cache | undefined;
  try {
    cache = await caches.open(cacheName);
    await cache.put(request, responseToCache);
  } catch (error) {
    // The entry did not exist before this attempt. Cache.put is atomic, and the
    // delete is additional defense for non-conforming/failed implementations.
    if (cache) {
      try {
        await cache.delete(request);
      } catch {}
    }
    throw error;
  }
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
