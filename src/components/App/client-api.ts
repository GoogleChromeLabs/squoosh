import App from './index';
import { SideEvent, SideEventType } from '../compress/index';

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
        SideEventType.START,
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
        SideEventType.DONE,
        (event: Event) => {
          if ((event as SideEvent).side !== side) {
            return;
          }
          resolve(this._app.compressInstance!.state.sides[side].file);
        },
      );
      document.addEventListener(
        SideEventType.ABORT,
        (event) => {
          if ((event as SideEvent).side !== side) {
            return;
          }
          reject(new DOMException('Aborted', 'AbortError'));
        },
      );
      document.addEventListener(
        SideEventType.ERROR,
        (event) => {
          if ((event as SideEvent).side !== side) {
            return;
          }
          reject((event as SideEvent).error);
        },
      );
    });
  }
}
