/**
 * TypeScript type definitions for WordPress integration
 */

export interface WordPressImageSize {
  width: number;
  height: number;
  crop: boolean;
}

export interface WordPressImageSizes {
  thumbnail: WordPressImageSize;
  medium: WordPressImageSize;
  large: WordPressImageSize;
  [key: string]: WordPressImageSize;
}

export interface CompressionOptions {
  format?: 'webp' | 'avif' | 'mozjpeg' | 'oxipng' | 'jxl';
  quality?: number;
  effort?: number;
  lossless?: boolean;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: ArrayBuffer;
  format: string;
  width: number;
  height: number;
}

export interface ThumbnailResult {
  size: string;
  width: number;
  height: number;
  data: ArrayBuffer;
  mimeType: string;
}

export interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error, index: number) => void;
}

export interface BatchProcessResult {
  successful: number;
  failed: number;
  results: (CompressionResult | null)[];
  errors: (Error | null)[];
}
