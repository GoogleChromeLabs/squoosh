import { get, set } from 'idb-keyval';

// Just for TypeScript
import SnackBarElement from './SnackBar';

/** Set up the service worker and monitor changes */
export async function offliner(showSnack: SnackBarElement['showSnackbar']) {
  // This needs to be a typeof because Webpack.
  if (typeof PRERENDER === 'boolean') return;

  if (process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('../sw');
  }

  if (new URL(location.href).searchParams.has('updated')) return;

  await new Promise(r => setTimeout(r, 5000));

  // Ask the user if they want to update.
  const result = await showSnack('Update available', {
    actions: ['reload', 'dismiss'],
  });

  // Tell the waiting worker to activate, this will change the controller and cause a reload (see
  // 'controllerchange')
  if (result === 'reload') {
    location.href = '/?updated';
  }
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
}
