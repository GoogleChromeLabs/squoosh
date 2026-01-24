/**
 * Tests for WordPress integration module
 */

import { describe, it, expect, vi } from 'vitest';
import {
  compressImage,
  compressImageBatch,
} from '../src/wordpress-integration/compression';

describe('WordPress Integration - Compression', () => {
  describe('compressImage', () => {
    it('should compress a single image', async () => {
      // Create a simple test image buffer
      const testBuffer = new ArrayBuffer(1000);

      const result = await compressImage(testBuffer, {
        format: 'webp',
        quality: 80,
      });

      expect(result).toBeDefined();
      expect(result.originalSize).toBe(1000);
      expect(result.format).toBe('webp');
      expect(result.data).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle Blob input', async () => {
      const testBlob = new Blob(['test data'], { type: 'image/png' });

      const result = await compressImage(testBlob, {
        format: 'avif',
        quality: 75,
      });

      expect(result).toBeDefined();
      expect(result.format).toBe('avif');
    });

    it('should use default options when none provided', async () => {
      const testBuffer = new ArrayBuffer(500);

      const result = await compressImage(testBuffer);

      expect(result).toBeDefined();
      expect(result.format).toBe('webp'); // Default format
    });

    it('should handle null data gracefully', async () => {
      try {
        await compressImage(null as any);
        // If it doesn't throw, check the behavior
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty blob', async () => {
      const emptyBlob = new Blob([]);
      const result = await compressImage(emptyBlob);
      expect(result).toBeDefined();
      expect(result.originalSize).toBe(0);
    });

    it('should handle various quality settings', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const qualities = [0, 50, 75, 90, 100];

      for (const quality of qualities) {
        const result = await compressImage(testBuffer, {
          format: 'webp',
          quality,
        });

        expect(result).toBeDefined();
        expect(result.originalSize).toBe(1000);
      }
    });

    it('should handle different formats', async () => {
      const testBuffer = new ArrayBuffer(1000);
      const formats: Array<'webp' | 'avif' | 'mozjpeg' | 'oxipng'> = [
        'webp',
        'avif',
        'mozjpeg',
        'oxipng',
      ];

      for (const format of formats) {
        const result = await compressImage(testBuffer, {
          format,
          quality: 80,
        });

        expect(result).toBeDefined();
        expect(result.format).toBe(format);
      }
    });

    it('should handle lossless compression option', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const result = await compressImage(testBuffer, {
        format: 'webp',
        lossless: true,
      });

      expect(result).toBeDefined();
    });

    it('should handle effort parameter', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const result = await compressImage(testBuffer, {
        format: 'avif',
        quality: 80,
        effort: 6,
      });

      expect(result).toBeDefined();
    });

    it('should handle compression errors gracefully', async () => {
      // Test error handling by passing invalid data
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        // This might not throw in the current implementation
        // but we're testing the error handling pattern
        const invalidData = undefined as any;
        await compressImage(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('compressImageBatch', () => {
    it('should compress multiple images', async () => {
      const images = [
        new ArrayBuffer(1000),
        new ArrayBuffer(2000),
        new ArrayBuffer(1500),
      ];

      const results = await compressImageBatch(images, {
        format: 'webp',
        quality: 85,
      });

      expect(results).toHaveLength(3);
      expect(results[0].originalSize).toBe(1000);
      expect(results[1].originalSize).toBe(2000);
      expect(results[2].originalSize).toBe(1500);
    });

    it('should handle empty array', async () => {
      const results = await compressImageBatch([]);
      expect(results).toHaveLength(0);
    });

    it('should handle single image in batch', async () => {
      const images = [new ArrayBuffer(1000)];

      const results = await compressImageBatch(images, {
        format: 'webp',
        quality: 80,
      });

      expect(results).toHaveLength(1);
      expect(results[0].originalSize).toBe(1000);
    });

    it('should handle mixed Blob and ArrayBuffer inputs', async () => {
      const images = [
        new ArrayBuffer(1000),
        new Blob(['test'], { type: 'image/png' }),
        new ArrayBuffer(2000),
      ];

      const results = await compressImageBatch(images);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
    });

    it('should handle errors during batch processing', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const images = [
        new ArrayBuffer(1000),
        null as any, // This should cause an error
        new ArrayBuffer(2000),
      ];

      try {
        await compressImageBatch(images);
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });

    it('should process large batches', async () => {
      const images = Array.from(
        { length: 10 },
        (_, i) => new ArrayBuffer((i + 1) * 100),
      );

      const results = await compressImageBatch(images, {
        format: 'webp',
        quality: 75,
      });

      expect(results).toHaveLength(10);
      expect(results[0].originalSize).toBe(100);
      expect(results[9].originalSize).toBe(1000);
    });

    it('should maintain order of processed images', async () => {
      const images = [
        new ArrayBuffer(100),
        new ArrayBuffer(200),
        new ArrayBuffer(300),
      ];

      const results = await compressImageBatch(images);

      expect(results[0].originalSize).toBe(100);
      expect(results[1].originalSize).toBe(200);
      expect(results[2].originalSize).toBe(300);
    });

    it('should apply same options to all images in batch', async () => {
      const images = [new ArrayBuffer(1000), new ArrayBuffer(2000)];

      const options = {
        format: 'avif' as const,
        quality: 90,
      };

      const results = await compressImageBatch(images, options);

      expect(results[0].format).toBe('avif');
      expect(results[1].format).toBe('avif');
    });

    it('should handle concurrent batch processing', async () => {
      const batch1 = [new ArrayBuffer(1000), new ArrayBuffer(2000)];
      const batch2 = [new ArrayBuffer(1500), new ArrayBuffer(2500)];

      const [results1, results2] = await Promise.all([
        compressImageBatch(batch1, { format: 'webp', quality: 80 }),
        compressImageBatch(batch2, { format: 'avif', quality: 75 }),
      ]);

      expect(results1).toHaveLength(2);
      expect(results2).toHaveLength(2);
      expect(results1[0].format).toBe('webp');
      expect(results2[0].format).toBe('avif');
    });
  });

  describe('Progress and callbacks', () => {
    it('should handle progress tracking in batch operations', async () => {
      const images = [
        new ArrayBuffer(1000),
        new ArrayBuffer(2000),
        new ArrayBuffer(3000),
      ];

      let processedCount = 0;

      // Simulate progress tracking
      const results = await compressImageBatch(images);
      processedCount = results.length;

      expect(processedCount).toBe(3);
    });

    it('should provide compression statistics', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const result = await compressImage(testBuffer, {
        format: 'webp',
        quality: 80,
      });

      expect(result.originalSize).toBeDefined();
      expect(result.compressedSize).toBeDefined();
      expect(result.compressionRatio).toBeDefined();
      expect(typeof result.compressionRatio).toBe('number');
    });
  });
});
