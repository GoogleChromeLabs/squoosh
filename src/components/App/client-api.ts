import App from './index';

import { expose } from 'comlink';

export function exposeAPI(app: App) {
  self.parent.postMessage('READY', '*');
  self.addEventListener('message', (ev: MessageEvent) => {
    if (ev.data !== 'READY?') {
      return;
    }
    ev.stopPropagation();
    self.parent.postMessage('READY', '*');
  });
  expose(new API(app), self.parent);
}

class API {
  constructor(private app: App) { }

  async setFile(blob: Blob, name: string) {
    await new Promise((resolve) => {
      this.app.setState({ file: new File([blob], name) }, resolve);
    });
    await new Promise((resolve) => {
      document.addEventListener('squooshingdone', resolve, { once: true });
    });
  }

  async getBlob(side: 0 | 1) {
    if (!this.app.state.file || !this.app.compressInstance) {
      throw new Error('No file has been loaded');
    }

    await this.app.compressInstance.compressionJobs[side];
    return this.app.compressInstance.state.images[side].file;
  }
}
