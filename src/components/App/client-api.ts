import App from './index';

import { expose } from 'comlink';

const API_VERSION = 1;

export function exposeAPI(app: App) {
  self.parent.postMessage({ type: 'READY', version: API_VERSION }, '*');
  self.addEventListener('message', (ev: MessageEvent) => {
    if (ev.data !== 'READY?') {
      return;
    }
    ev.stopPropagation();
    self.parent.postMessage({ type: 'READY', version: API_VERSION }, '*');
  });
  expose(new API(app), self.parent);
}

class API {
  constructor(private app: App) { }

  async setFile(blob: Blob, name: string) {
    return new Promise(async (resolve) => {
      document.addEventListener(
        'squoosh:processingstart',
        () => resolve(),
        { once: true },
      );
      this.app.openFile(new File([blob], name));
    });
  }

  async getBlob(side: 0 | 1) {
    if (!this.app.state.file || !this.app.compressInstance) {
      throw new Error('No file has been loaded');
    }
    if (
      !this.app.compressInstance!.state.loading &&
      !this.app.compressInstance!.state.sides[side].loading
    ) {
      return this.app.compressInstance!.state.sides[side].file;
    }

    return new Promise((resolve, reject) => {
      document.addEventListener(
        'squoosh:processingdone',
        (ev) => {
          if ((ev as CustomEvent).detail.side !== side) {
            return;
          }
          resolve(this.app.compressInstance!.state.sides[side].file);
        },
      );
      document.addEventListener(
        'squoosh:processingabort',
        (ev) => {
          if ((ev as CustomEvent).detail.side !== side) {
            return;
          }
          reject('aborted');
        },
      );
      document.addEventListener(
        'squoosh:processingerroor',
        (ev) => {
          if ((ev as CustomEvent).detail.side !== side) {
            return;
          }
          reject((ev as CustomEvent).detail.msg);
        },
      );
    });
  }
}
