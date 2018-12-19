import App from './index';

import { expose } from 'comlink';

const API_VERSION = 1;

export function exposeAPI(app: App) {
  self.parent.postMessage({ type: 'READY', version: API_VERSION }, '*');
  self.addEventListener('message', (event: MessageEvent) => {
    if (event.data !== 'READY?') {
      return;
    }
    event.stopImmediatePropagation();
    self.parent.postMessage({ type: 'READY', version: API_VERSION }, '*');
  });
  expose(new API(app), self.parent);
}

class API {
  constructor(private _app: App) { }

  setFile(blob: Blob, name: string) {
    return new Promise((resolve) => {
      document.addEventListener(
        'squoosh:processingstart',
        () => resolve(),
        { once: true },
      );
      this._app.openFile(new File([blob], name));
    });
  }

  getBlob(side: 0 | 1) {
    if (!this._app.state.file || !this._app.compressInstance) {
      throw new Error('No file has been loaded');
    }
    if (
      !this._app.compressInstance!.state.loading &&
      !this._app.compressInstance!.state.sides[side].loading
    ) {
      return this._app.compressInstance!.state.sides[side].file;
    }

    return new Promise((resolve, reject) => {
      document.addEventListener(
        'squoosh:processingdone',
        (event) => {
          if ((event as CustomEvent).detail.side !== side) {
            return;
          }
          resolve(this._app.compressInstance!.state.sides[side].file);
        },
      );
      document.addEventListener(
        'squoosh:processingabort',
        (event) => {
          if ((event as CustomEvent).detail.side !== side) {
            return;
          }
          reject(new DOMException('Aborted', 'AbortError'));
        },
      );
      document.addEventListener(
        'squoosh:processingerror',
        (event) => {
          if ((event as CustomEvent).detail.side !== side) {
            return;
          }
          reject(new Error((event as CustomEvent).detail.msg));
        },
      );
    });
  }
}
