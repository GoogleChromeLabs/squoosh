export interface EncodeOptions {}
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'identity';
export const label = 'Original image';
export const defaultOptions: EncodeOptions = {};
