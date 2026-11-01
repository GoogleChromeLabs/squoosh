import { registerSW } from 'virtual:pwa-register';
import type { ShowSnack } from '@/composables/useSnackbar';

/** Registers the service worker, and tells the user about updates. */
export function registerServiceWorker(showSnack: ShowSnack) {
  const updateSW = registerSW({
    async onNeedRefresh() {
      const result = await showSnack('Update available', {
        actions: ['reload', 'dismiss'],
      });
      // Activates the waiting worker and reloads.
      if (result === 'reload') updateSW(true);
    },
    onOfflineReady() {
      showSnack('Ready to work offline', { timeout: 5000 });
    },
  });
}

/** The page was opened by sharing an image to the installed app. */
export function isShareTarget(): boolean {
  return new URL(location.href).searchParams.has('share-target');
}

/** Waits for the service worker to hand over the shared image. */
export async function getSharedImage(): Promise<File> {
  const registration = await navigator.serviceWorker.ready;

  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'LOAD_IMAGE') return;
      navigator.serviceWorker.removeEventListener('message', onMessage);
      resolve(event.data.file);
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    // This tells the service worker we're ready to receive the file.
    (navigator.serviceWorker.controller ?? registration.active)!.postMessage({
      type: 'SHARE_READY',
    });
  });
}

/** Asks the service worker to cache all codecs, so the editor works offline. */
export async function cacheAllCodecs() {
  const registration = await navigator.serviceWorker?.getRegistration();
  // Use the worker that's active or closest to it.
  const worker =
    registration?.active ?? registration?.waiting ?? registration?.installing;
  worker?.postMessage({ type: 'CACHE_ALL' });
}
