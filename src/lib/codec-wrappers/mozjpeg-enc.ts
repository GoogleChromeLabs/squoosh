import {Encoder} from './codec';

import mozjpeg_enc from '../../../codecs/mozjpeg_enc/mozjpeg_enc';
// Using require() so TypeScript doesn’t complain about this not being a module.
const wasmBinaryUrl = require('../../../codecs/mozjpeg_enc/mozjpeg_enc.wasm');

export class MozJpegEncoder implements Encoder {
  private emscriptenModule: Promise<EmscriptenWasm.Module>;
  constructor() {
    this.emscriptenModule = new Promise(resolve => {
      const m = mozjpeg_enc({
        // Just to be safe, don’t automatically invoke any wasm functions
        // noInitialRun: false,
        locateFile(url: string): string {
          // Redirect the request for the wasm binary to whatever webpack gave us.
          if(url.endsWith('.wasm')) {
            return wasmBinaryUrl;
          }
          return url;
        },
        onRuntimeInitialized() {
          resolve(m);
        }
      });
    });
  }

  async encode(bitmap: ImageBitmap): Promise<ArrayBuffer> {
    console.log('awaiting module');
    debugger;
    const m = await this.emscriptenModule;
    console.log(m);
    return Promise.resolve(<ArrayBuffer>new Uint8Array([1,2,3]).buffer);
  }
}
