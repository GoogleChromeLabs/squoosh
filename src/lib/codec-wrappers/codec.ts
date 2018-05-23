export interface Encoder {
  encode(data: ImageData): Promise<ArrayBuffer>;
}

export interface Decoder {
  decode(data: ArrayBuffer): Promise<ImageBitmap>;
}
