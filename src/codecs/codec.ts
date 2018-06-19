export interface Encoder {
  encode(data: ImageData, options: any): Promise<ArrayBuffer | ImageData>;
}

export interface Decoder {
  decode(data: ArrayBuffer): Promise<ImageBitmap>;
}
