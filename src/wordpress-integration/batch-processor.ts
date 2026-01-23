/**
 * Batch processing utilities for WordPress
 */

import type { BatchProcessOptions, BatchProcessResult, CompressionOptions } from './types';
import { compressImage } from './compression';

/**
 * Process multiple images in parallel with controlled concurrency
 * @param images - Array of image data to process
 * @param options - Batch processing options
 * @param compressionOptions - Options for image compression
 * @returns Promise with batch processing results
 */
export async function batchProcessor(
  images: (ArrayBuffer | Blob)[],
  options: BatchProcessOptions = {},
  compressionOptions: CompressionOptions = {}
): Promise<BatchProcessResult> {
  const { 
    concurrency = 4,
    onProgress,
    onError,
  } = options;

  const results: BatchProcessResult = {
    successful: 0,
    failed: 0,
    results: [],
    errors: [],
  };

  let completed = 0;
  const total = images.length;

  // Process images in chunks based on concurrency
  for (let i = 0; i < images.length; i += concurrency) {
    const chunk = images.slice(i, i + concurrency);
    const promises = chunk.map(async (image, chunkIndex) => {
      const actualIndex = i + chunkIndex;
      try {
        const result = await compressImage(image, compressionOptions);
        results.results[actualIndex] = result;
        results.errors[actualIndex] = null;
        results.successful++;
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.results[actualIndex] = null;
        results.errors[actualIndex] = err;
        results.failed++;
        
        if (onError) {
          onError(err, actualIndex);
        }
        
        return null;
      } finally {
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      }
    });

    await Promise.all(promises);
  }

  return results;
}
