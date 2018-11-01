import { cacheOrNetworkAndCache, cleanupCache, cacheOrNetwork } from './strategies';
import webpDataUrl from 'url-loader!../codecs/tiny.webp';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;
// This is populated by webpack.
declare var BUILD_ASSETS: string[];

const version = '1.0.0';
const versionedCache = 'static-' + version;
const dynamicCache = 'dynamic';
const expectedCaches = [versionedCache, dynamicCache];

self.addEventListener('install', (event) => {
  event.waitUntil(async function () {
    let toCache = ['/', '/assets/favicon.ico'];

    const prefixesToCache = [
      // First interaction JS & CSS:
      'first-interaction.',
      // Main app JS & CSS:
      'main-app.',
      // Little icons for the demo images on the homescreen:
      'icon-demo-',
      // Site logo:
      'logo.',
      // Worker which handles image processing:
      'processor-worker.',
      // processor-worker imports:
      'process-',
    ];

    const prefixMatches = BUILD_ASSETS.filter(
      asset => prefixesToCache.some(prefix => asset.startsWith(prefix)),
    );

    const wasm = BUILD_ASSETS.filter(asset => asset.endsWith('.wasm'));

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

    const cache = await caches.open(versionedCache);
    await cache.addAll(toCache);
  }());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(async function () {
    // Remove old caches.
    const promises = (await caches.keys()).map((cacheName) => {
      if (!expectedCaches.includes(cacheName)) return caches.delete(cacheName);
    });

    await Promise.all<any>(promises);
  }());
});

self.addEventListener('fetch', (event) => {
  // We only care about GET.
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't care about other-origin URLs
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/demo-') || url.pathname.startsWith('/wc-polyfill')) {
    cacheOrNetworkAndCache(event, dynamicCache);
    cleanupCache(event, dynamicCache, BUILD_ASSETS);
    return;
  }

  cacheOrNetwork(event);
});
