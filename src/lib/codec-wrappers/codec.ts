export interface Encoder {
  encode(data: ImageData): Promise<ArrayBuffer | SharedArrayBuffer>;
}

export interface Decoder {
  decode(data: ArrayBuffer): Promise<ImageBitmap>;
}
