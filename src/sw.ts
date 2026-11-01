/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

/** Codec wasm, cached once the editor is used. The file names are hashed. */
const wasmCacheName = 'wasm';
/** Demo images, cached when used. */
const demoCacheName = 'demos';

function entryUrl(entry: PrecacheEntry | string): string {
  return new URL(
    typeof entry === 'string' ? entry : entry.url,
    self.location.href,
  ).href;
}

const manifest = self.__WB_MANIFEST;

// Precaching all the codecs (~15 MB) on install would be too much for people
// who only look at the intro, so wasm is cached separately.
const wasmUrls = manifest.map(entryUrl).filter((url) => url.endsWith('.wasm'));

precacheAndRoute(
  manifest.filter((entry) => !entryUrl(entry).endsWith('.wasm')),
);
cleanupOutdatedCaches();

/** Caches every codec that isn't cached yet. */
async function cacheAllWasm() {
  const cache = await caches.open(wasmCacheName);
  const cached = new Set((await cache.keys()).map((request) => request.url));
  await cache.addAll(wasmUrls.filter((url) => !cached.has(url)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // If the user has already used the editor, update the codecs too, so
      // it keeps working offline.
      const cache = await caches.open(wasmCacheName);
      if ((await cache.keys()).length) await cacheAllWasm();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove codecs from previous versions.
      const cache = await caches.open(wasmCacheName);
      const current = new Set(wasmUrls);
      await Promise.all(
        (await cache.keys())
          .filter((request) => !current.has(request.url))
          .map((request) => cache.delete(request)),
      );
      await self.clients.claim();
    })(),
  );
});

registerRoute(
  ({ url }) => url.pathname.endsWith('.wasm'),
  new CacheFirst({ cacheName: wasmCacheName }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/demo-'),
  new CacheFirst({ cacheName: demoCacheName }),
);

/* Share target: the manifest's share_target POSTs the image here. */

const messageWaiters = new Map<string, (() => void)[]>();

/** Resolves when a page posts a message of this type. */
function nextMessage(type: string): Promise<void> {
  return new Promise((resolve) => {
    const waiters = messageWaiters.get(type) ?? [];
    waiters.push(resolve);
    messageWaiters.set(type, waiters);
  });
}

registerRoute(
  ({ url, request }) =>
    url.pathname === '/' &&
    url.searchParams.has('share-target') &&
    request.method === 'POST',
  ({ event }) => {
    const fetchEvent = event as FetchEvent;
    const dataPromise = fetchEvent.request.formData();

    fetchEvent.waitUntil(
      (async () => {
        // The page posts this once it's ready to receive the file.
        await nextMessage('SHARE_READY');
        const client = await self.clients.get(fetchEvent.resultingClientId);
        const data = await dataPromise;
        client?.postMessage({ type: 'LOAD_IMAGE', file: data.get('file') });
      })(),
    );

    // Redirect so the user can refresh the page without resending data.
    return Promise.resolve(Response.redirect('/?share-target', 303));
  },
  'POST',
);

// It's a single page app.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

self.addEventListener('message', (event) => {
  const type = event.data?.type;

  const waiters = messageWaiters.get(type);
  if (waiters) {
    messageWaiters.delete(type);
    for (const resolve of waiters) resolve();
  }

  switch (type) {
    // Sent by the page when the editor opens.
    case 'CACHE_ALL':
      event.waitUntil(cacheAllWasm());
      break;
    // Sent by virtual:pwa-register when the user accepts an update.
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});
