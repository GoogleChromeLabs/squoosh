import {Encoder} from './codec';

import mozjpeg_enc from '../../../codecs/mozjpeg_enc/mozjpeg_enc';

export class MozJpegEncoder implements Encoder {
  private emscriptenModule: Promise<EmscriptenWasm.Module>;
  constructor() {
    this.emscriptenModule = new Promise(resolve => {
      console.log(mozjpeg_enc);
      const m = mozjpeg_enc();
      m.onRuntimeInitialized = () => resolve(m);
    });
  }

  async encode(bitmap: ImageBitmap): Promise<ArrayBuffer> {
    console.log('encoding!');
    const m = await this.emscriptenModule;
    console.log(m);
    return Promise.resolve(<ArrayBuffer>new Uint8Array([1,2,3]).buffer);
  }
}
