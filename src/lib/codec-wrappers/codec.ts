export interface Encoder {
  encode(image: ImageBitmap): Promise<ArrayBuffer>;
}

export interface Decoder {
  decode(data: ArrayBuffer): Promise<ImageBitmap>;
}
