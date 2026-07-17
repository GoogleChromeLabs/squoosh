import type SnackBarElement from 'shared/custom-els/snack-bar';

import { get, set } from 'idb-keyval';

import swUrl from 'service-worker:sw';

/** Tell the service worker to skip waiting */
async function skipWaiting() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !reg.waiting) return;
  reg.waiting.postMessage('skip-waiting');
}

/** Find the service worker that's 'active' or closest to 'active' */
async function getMostActiveServiceWorker() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.active || reg.waiting || reg.installing;
}

/** Wait for an installing worker */
async function installingWorker(
  reg: ServiceWorkerRegistration,
): Promise<ServiceWorker> {
  if (reg.installing) return reg.installing;
  return new Promise<ServiceWorker>((resolve) => {
    reg.addEventListener('updatefound', () => resolve(reg.installing!), {
      once: true,
    });
  });
}

/** Wait a service worker to become waiting */
async function updateReady(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.waiting) return;
  const installing = await installingWorker(reg);
  return new Promise<void>((resolve) => {
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed') resolve();
    });
  });
}

/** Wait for a shared image */
export function getSharedImage(): Promise<File> {
  return new Promise((resolve) => {
    const onmessage = (event: MessageEvent) => {
      if (event.data.action !== 'load-image') return;
      resolve(event.data.file);
      navigator.serviceWorker.removeEventListener('message', onmessage);
    };

    navigator.serviceWorker.addEventListener('message', onmessage);

    // This message is picked up by the service worker - it's how it knows we're ready to receive
    // the file.
    navigator.serviceWorker.controller!.postMessage('share-ready');
  });
}

/** Set up the service worker and monitor changes */
export async function offliner(showSnack: SnackBarElement['showSnackbar']) {
  if (__PRODUCTION__) navigator.serviceWorker.register(swUrl);

  const hasController = !!navigator.serviceWorker.controller;

  // Look for changes in the controller
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    // Is it the first install?
    if (!hasController) {
      showSnack('Ready to work offline', { timeout: 5000 });
      return;
    }

    // Otherwise reload (the user will have agreed to this).
    location.reload();
  });

  // If we don't have a controller, we don't need to check for updates – we've just loaded from the
  // network.
  if (!hasController) return;

  const reg = await navigator.serviceWorker.getRegistration();
  // Service worker not registered yet.
  if (!reg) return;
  // Look for updates
  await updateReady(reg);

  // Ask the user if they want to update.
  const result = await showSnack('Update available', {
    actions: ['reload', 'dismiss'],
  });

  // Tell the waiting worker to activate, this will change the controller and cause a reload (see
  // 'controllerchange')
  if (result === 'reload') skipWaiting();
}

/**
 * Tell the service worker the main app has loaded. If it's the first time the service worker has
 * heard about this, cache the heavier assets like codecs.
 */
export async function mainAppLoaded() {
  // If the user has already interacted, no need to tell the service worker anything.
  const userInteracted = await get<boolean | undefined>('user-interacted');
  if (userInteracted) return;
  set('user-interacted', true);
  const serviceWorker = await getMostActiveServiceWorker();
  if (!serviceWorker) return; // Service worker not installing yet.
  serviceWorker.postMessage('cache-all');
}

export type Ben2CacheAssetRole =
  | 'features_worker'
  | 'model'
  | 'ort_asyncify_mjs'
  | 'ort_asyncify_wasm'
  | 'png_decoder_js'
  | 'png_decoder_wasm';

export interface Ben2CacheEntry {
  role: Ben2CacheAssetRole;
  path: string;
  cached: boolean;
}

export interface Ben2CacheStatus {
  controlled: boolean;
  cacheName?: string;
  entries: Ben2CacheEntry[];
  offlineReady: boolean;
}

const ben2CacheRoles: Ben2CacheAssetRole[] = [
  'features_worker',
  'model',
  'ort_asyncify_mjs',
  'ort_asyncify_wasm',
  'png_decoder_js',
  'png_decoder_wasm',
];
const ben2CacheRoleSet = new Set<string>(ben2CacheRoles);
const ben2CacheStatusTimeout = 2_000;

function unavailableBen2CacheStatus(): Ben2CacheStatus {
  return {
    controlled: false,
    entries: [],
    offlineReady: false,
  };
}

function isBen2CacheEntry(value: unknown): value is Ben2CacheEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<Ben2CacheEntry>;
  return (
    typeof entry.role === 'string' &&
    ben2CacheRoleSet.has(entry.role) &&
    typeof entry.path === 'string' &&
    typeof entry.cached === 'boolean'
  );
}

/**
 * Inspect the service worker-owned current-build inventory. This read-only,
 * advisory request is bounded and degrades to uncontrolled on transport,
 * controller, or service-worker lookup failure.
 */
export async function ben2CacheStatus(): Promise<Ben2CacheStatus> {
  let controller: ServiceWorker | null;
  try {
    controller = navigator.serviceWorker.controller;
  } catch {
    return unavailableBen2CacheStatus();
  }
  if (!controller) return unavailableBen2CacheStatus();

  return new Promise<Ben2CacheStatus>((resolve) => {
    let channel: MessageChannel;
    try {
      channel = new MessageChannel();
    } catch {
      resolve(unavailableBen2CacheStatus());
      return;
    }
    let settled = false;
    let timer: number | undefined;
    let listeningForControllerChange = false;

    const cleanup = () => {
      try {
        if (timer !== undefined) clearTimeout(timer);
      } catch {}
      channel.port1.onmessage = null;
      channel.port1.onmessageerror = null;
      try {
        channel.port1.close();
      } catch {}
      try {
        channel.port2.close();
      } catch {}
      if (listeningForControllerChange) {
        try {
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            onControllerChange,
          );
        } catch {}
      }
    };
    const finish = (status = unavailableBen2CacheStatus()) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(status);
    };
    const onControllerChange = () => finish();

    channel.port1.onmessage = (event: MessageEvent) => {
      const response = event.data as {
        ok?: unknown;
        cacheName?: unknown;
        entries?: unknown;
      };
      if (
        response?.ok !== true ||
        typeof response.cacheName !== 'string' ||
        !Array.isArray(response.entries) ||
        !response.entries.every(isBen2CacheEntry)
      ) {
        finish();
        return;
      }
      const entries = response.entries as Ben2CacheEntry[];
      finish({
        controlled: true,
        cacheName: response.cacheName,
        entries,
        offlineReady:
          entries.length === ben2CacheRoles.length &&
          ben2CacheRoles.every((role) =>
            entries.some((entry) => entry.role === role && entry.cached),
          ),
      });
    };
    channel.port1.onmessageerror = () => finish();

    try {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        onControllerChange,
      );
      listeningForControllerChange = true;
      timer = setTimeout(() => finish(), ben2CacheStatusTimeout);
      controller!.postMessage({ action: 'ben2-cache-status' }, [channel.port2]);
    } catch {
      finish();
    }
  });
}
