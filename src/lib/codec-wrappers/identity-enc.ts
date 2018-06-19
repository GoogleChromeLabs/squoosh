import { Encoder } from './codec';

type EncodeOptions = {};

export default class IdentityEncoder implements Encoder {
  static mimeType = null;

  async encode(data: ImageData, options: EncodeOptions): Promise<ImageData> {
    return data;
  }
}
