export interface Encoder<OptionsType> {
  encode(data: ImageData, options: OptionsType): Promise<ArrayBuffer | ImageData>;
}

export interface Decoder {
  decode(data: ArrayBuffer): Promise<ImageBitmap>;
}
