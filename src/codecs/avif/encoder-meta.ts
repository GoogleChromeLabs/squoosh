export interface EncodeOptions { }

export const type = 'avif';
export const label = 'AVIF';
export const mimeType = 'image/avif';
export const extension = 'avif';
export const defaultOptions: EncodeOptions = {
};

export interface EncoderState { type: typeof type; options: EncodeOptions; }
