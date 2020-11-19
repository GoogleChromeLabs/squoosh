import {
  cacheOrNetworkAndCache,
  cleanupCache,
  cacheOrNetwork,
  cacheBasics,
  cacheAdditionalProcessors,
  serveShareTarget,
} from './util';
import { get } from 'idb-keyval';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

const versionedCache = 'static-' + VERSION;
const dynamicCache = 'dynamic';
const expectedCaches = [versionedCache, dynamicCache];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async function () {
      const promises = [];
      promises.push(cacheBasics(versionedCache, ASSETS));

      // If the user has already interacted with the app, update the codecs too.
      if (await get('user-interacted')) {
        promises.push(cacheAdditionalProcessors(versionedCache, ASSETS));
      }

      await Promise.all(promises);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();

  event.waitUntil(
    (async function () {
      // Remove old caches.
      const promises = (await caches.keys()).map((cacheName) => {
        if (!expectedCaches.includes(cacheName))
          return caches.delete(cacheName);
      });

      await Promise.all<any>(promises);
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't care about other-origin URLs
  if (url.origin !== location.origin) return;

  if (
    url.pathname === '/' &&
    url.searchParams.has('share-target') &&
    event.request.method === 'POST'
  ) {
    serveShareTarget(event);
    return;
  }

  // We only care about GET from here on in.
  if (event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/c/demo-')) {
    cacheOrNetworkAndCache(event, dynamicCache);
    cleanupCache(event, dynamicCache, ASSETS);
    return;
  }

  cacheOrNetwork(event);
});

self.addEventListener('message', (event) => {
  switch (event.data) {
    case 'cache-all':
      event.waitUntil(cacheAdditionalProcessors(versionedCache, ASSETS));
      break;
    case 'skip-waiting':
      self.skipWaiting();
      break;
  }
});
