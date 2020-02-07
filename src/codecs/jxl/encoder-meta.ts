export interface EncodeOptions {
  speed: number;
}

export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'jxl';
export const label = 'JPEG XL';
export const mimeType = 'image/jpegxl';
export const extension = 'jxl';
// These come from struct WebPConfig in encode.h.
export const defaultOptions: EncodeOptions = {
  speed: 1,
};
