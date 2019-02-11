import App from './index';
import { SquooshStartEventType, SquooshSideEventType } from '../compress/index';

import { expose } from 'comlink';

export function exposeAPI(app: App) {
  self.parent.postMessage({ type: 'READY', version: MAJOR_VERSION }, '*');
  self.addEventListener('message', (event: MessageEvent) => {
    if (event.data !== 'READY?') {
      return;
    }
    event.stopImmediatePropagation();
    self.parent.postMessage({ type: 'READY', version: MAJOR_VERSION }, '*');
  });
  expose(new API(app), self.parent);
}

function addRemovableGlobalListener<
  K extends keyof GlobalEventHandlersEventMap
>(name: K, listener: (ev: GlobalEventHandlersEventMap[K]) => void): () => void {
  document.addEventListener(name, listener);
  return () => document.removeEventListener(name, listener);
}

class API {
  constructor(private _app: App) {}

  async setFile(blob: Blob, name: string) {
    return new Promise((resolve) => {
      document.addEventListener(SquooshStartEventType.START, () => resolve(), {
        once: true,
      });
      this._app.openFile(new File([blob], name));
    });
  }

  async getBlob(side: 0 | 1) {
    if (!this._app.state.file || !this._app.compressInstance) {
      throw new Error('No file has been loaded');
    }
    if (
      !this._app.compressInstance!.state.loading &&
      !this._app.compressInstance!.state.sides[side].loading
    ) {
      return this._app.compressInstance!.state.sides[side].file;
    }

    const listeners: ReturnType<typeof addRemovableGlobalListener>[] = [];

    const r = new Promise((resolve, reject) => {
      listeners.push(
        addRemovableGlobalListener(SquooshSideEventType.DONE, (event) => {
          if (event.side !== side) {
            return;
          }
          resolve(this._app.compressInstance!.state.sides[side].file);
        }),
      );
      listeners.push(
        addRemovableGlobalListener(SquooshSideEventType.ABORT, (event) => {
          if (event.side !== side) {
            return;
          }
          reject(new DOMException('Aborted', 'AbortError'));
        }),
      );
      listeners.push(
        addRemovableGlobalListener(SquooshSideEventType.ERROR, (event) => {
          if (event.side !== side) {
            return;
          }
          reject(event.error);
        }),
      );
    });
    r.then(() => listeners.forEach(remove => remove()));
    return r;
  }
}
