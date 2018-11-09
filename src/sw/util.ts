import webpDataUrl from 'url-loader!../codecs/tiny.webp';

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

function getAssetsWithPrefix(assets: string[], prefixes: string[]) {
  return assets.filter(
    asset => prefixes.some(prefix => asset.startsWith(prefix)),
  );
}

export async function cacheBasics(cacheName: string, buildAssets: string[]) {
  const toCache = ['/', '/assets/favicon.ico'];

  const prefixesToCache = [
    // First interaction JS & CSS:
    'first-interaction.',
    // Main app JS & CSS:
    'main-app.',
    // Service worker handler:
    'offliner.',
    // Little icons for the demo images on the homescreen:
    'icon-demo-',
    // Site logo:
    'logo.',
  ];

  const prefixMatches = getAssetsWithPrefix(buildAssets, prefixesToCache);

  toCache.push(...prefixMatches);

  const cache = await caches.open(cacheName);
  await cache.addAll(toCache);
}

export async function cacheAdditionalProcessors(cacheName: string, buildAssets: string[]) {
  let toCache = [];

  const prefixesToCache = [
    // Worker which handles image processing:
    'processor-worker.',
    // processor-worker imports:
    'process-',
  ];

  const prefixMatches = getAssetsWithPrefix(buildAssets, prefixesToCache);
  const wasm = buildAssets.filter(asset => asset.endsWith('.wasm'));

  toCache.push(...prefixMatches, ...wasm);

  const supportsWebP = await (async () => {
    if (!self.createImageBitmap) return false;
    const response = await fetch(webpDataUrl);
    const blob = await response.blob();
    return createImageBitmap(blob).then(() => true, () => false);
  })();

  // No point caching the WebP decoder if it's supported natively:
  if (supportsWebP) {
    toCache = toCache.filter(asset => !/webp[\-_]dec/.test(asset));
  }

  const cache = await caches.open(cacheName);
  await cache.addAll(toCache);
}
