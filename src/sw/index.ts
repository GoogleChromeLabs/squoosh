import {
  cacheBen2Asset,
  cacheOrNetworkAndCache,
  cleanupCache,
  cacheOrNetwork,
  cacheBasics,
  cacheAdditionalProcessors,
  serveShareTarget,
} from './util';
import {
  ben2ModelCacheName,
  isBen2ModelDownloadRequest,
  matchValidatedBen2Model,
} from 'features/processors/ben2/shared/model-cache';
import { get } from 'idb-keyval';
import {
  ben2AssetInventory,
  ben2Assets,
  shouldCacheDynamically,
} from './to-cache';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

const versionedCache = 'static-' + VERSION;
const dynamicCache = 'dynamic';
const expectedCaches = [versionedCache, dynamicCache, ben2ModelCacheName];
const ben2ModelAssets = ben2AssetInventory.filter(
  ({ role }) => role === 'model',
);
if (ben2ModelAssets.length !== 1)
  throw new Error(`Expected one BEN2 model, found ${ben2ModelAssets.length}`);
const ben2ModelAsset = ben2ModelAssets[0];
const inventoryModelRequest = new Request(
  new URL(ben2ModelAsset.path, location.origin).href,
  { headers: { 'X-Squoosh-BEN2-Download': 'v1' } },
);
if (!isBen2ModelDownloadRequest(inventoryModelRequest)) {
  throw new Error('BEN2 model inventory does not match the shared model URL');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async function () {
      const promises = [];
      promises.push(cacheBasics(versionedCache));

      // If the user has already interacted with the app, update the codecs too.
      if (await get('user-interacted')) {
        promises.push(cacheAdditionalProcessors(versionedCache));
      }

      await Promise.all(promises);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();

  event.waitUntil(
    (async function () {
      // Remove old caches while preserving the current dedicated model cache.
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

  if (url.pathname === '/editor') {
    event.respondWith(Response.redirect('/'));
    return;
  }

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

  if (url.pathname === ben2ModelAsset.path) {
    if (isBen2ModelDownloadRequest(event.request)) {
      // The page owns admission. The SW only removes its routing sentinel and
      // lets this one explicit request reach the origin.
      const headers = new Headers(event.request.headers);
      headers.delete('X-Squoosh-BEN2-Download');
      event.respondWith(fetch(new Request(event.request, { headers })));
      return;
    }

    // Every ordinary model GET is intrinsically cache-only in production.
    event.respondWith(
      (async () => {
        if (
          event.request.url !== inventoryModelRequest.url ||
          url.search !== '' ||
          event.request.headers.has('range')
        ) {
          return new Response('Invalid BEN2 model request', { status: 400 });
        }
        return (
          (await matchValidatedBen2Model()) ||
          new Response('BEN2 model is not cached', { status: 404 })
        );
      })(),
    );
    return;
  }

  // The other five BEN2 assets remain lazy after editor cache opt-in and are
  // persisted when the generated feature worker first fetches them.
  if (ben2Assets.includes(url.pathname)) {
    cacheBen2Asset(event, versionedCache);
    return;
  }

  if (shouldCacheDynamically(url.pathname)) {
    cacheOrNetworkAndCache(event, dynamicCache);
    cleanupCache(event, dynamicCache, ASSETS);
    return;
  }

  cacheOrNetwork(event);
});

self.addEventListener('message', (event) => {
  switch (event.data) {
    case 'cache-all':
      event.waitUntil(cacheAdditionalProcessors(versionedCache));
      break;
    case 'skip-waiting':
      self.skipWaiting();
      break;
  }
});
