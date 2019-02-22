import { proxy, ProxyResult } from 'comlink';

import { API, ReadyMessage } from './components/App/client-api';

/**
 * This function will load an iFrame
 * @param {HTMLIFrameElement} ifr iFrame that will be used to load squoosh
 * @param {string} src URL of squoosh instance to use
 */
export default async function loader(
  ifr: HTMLIFrameElement,
  src: string = 'https://squoosh.app',
): Promise<ProxyResult<API>> {
  ifr.src = src;
  await new Promise(resolve => (ifr.onload = resolve));
  ifr.contentWindow!.postMessage('READY?', '*');
  await new Promise((resolve) => {
    window.addEventListener('message', function l(ev) {
      const msg = ev.data as ReadyMessage;
      if (!msg || msg.type !== 'READY') {
        return;
      }
      if (msg.version !== MAJOR_VERSION) {
        throw Error(
          `Version mismatch. SDK version ${MAJOR_VERSION}, Squoosh version ${
            msg.version
          }`,
        );
      }
      ev.stopPropagation();
      window.removeEventListener('message', l);
      resolve();
    });
  });

  return proxy(ifr.contentWindow!);
}
