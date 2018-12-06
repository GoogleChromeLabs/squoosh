import {
  cacheOrNetworkAndCache, cleanupCache, cacheOrNetwork, cacheBasics, cacheAdditionalProcessors,
} from './util';
import { get } from 'idb-keyval';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;
// This is populated by webpack.
declare var BUILD_ASSETS: string[];

const versionedCache = 'static-' + VERSION;
const dynamicCache = 'dynamic';
const expectedCaches = [versionedCache, dynamicCache];

self.addEventListener('install', (event) => {
  event.waitUntil(async function () {
    const promises = [];
    promises.push(cacheBasics(versionedCache, BUILD_ASSETS));

    // If the user has already interacted with the app, update the codecs too.
    if (await get('user-interacted')) {
      promises.push(cacheAdditionalProcessors(versionedCache, BUILD_ASSETS));
    }

    await Promise.all(promises);
  }());
});

self.addEventListener('activate', (event) => {
  self.clients.claim();

  event.waitUntil(async function () {
    // Remove old caches.
    const promises = (await caches.keys()).map((cacheName) => {
      if (!expectedCaches.includes(cacheName)) return caches.delete(cacheName);
    });

    await Promise.all<any>(promises);
  }());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST') {
    // @ts-ignore - The type of respondWith is INCORRECT
    event.respondWith(new Response('Got a post request'));
    return;
  }
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

self.addEventListener('message', (event) => {
  switch (event.data) {
    case 'cache-all':
      event.waitUntil(cacheAdditionalProcessors(versionedCache, BUILD_ASSETS));
      break;
    case 'skip-waiting':
      self.skipWaiting();
      break;
  }
});
