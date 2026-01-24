/**
 * Tests for WordPress integration module
 */

import { describe, it, expect } from 'vitest';
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

    it('should handle empty ArrayBuffer', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const result = await compressImage(emptyBuffer);
      expect(result.originalSize).toBe(0);
    });

    it('should return compression ratio', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const result = await compressImage(testBuffer, {
        format: 'webp',
        quality: 80,
      });

      expect(result.compressionRatio).toBeDefined();
      expect(typeof result.compressionRatio).toBe('number');
    });

    it('should handle different formats', async () => {
      const testBuffer = new ArrayBuffer(1000);

      const webpResult = await compressImage(testBuffer, { format: 'webp' });
      expect(webpResult.format).toBe('webp');

      const avifResult = await compressImage(testBuffer, { format: 'avif' });
      expect(avifResult.format).toBe('avif');
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

    it('should process images sequentially', async () => {
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
      // All results should have the expected format
      results.forEach((result) => {
        expect(result.format).toBe('webp');
      });
    });

    it('should handle mixed Blob and ArrayBuffer inputs', async () => {
      const images = [
        new ArrayBuffer(1000),
        new Blob(['test'], { type: 'image/png' }),
        new ArrayBuffer(1500),
      ];

      const results = await compressImageBatch(images, {
        format: 'webp',
        quality: 80,
      });

      expect(results).toHaveLength(3);
    });

    it('should throw on null input in array', async () => {
      const images = [
        new ArrayBuffer(1000),
        null as any,
        new ArrayBuffer(1500),
      ];

      await expect(
        compressImageBatch(images, { format: 'webp' }),
      ).rejects.toThrow();
    });

    it('should apply same options to all images', async () => {
      const images = [new ArrayBuffer(1000), new ArrayBuffer(2000)];

      const results = await compressImageBatch(images, {
        format: 'avif',
        quality: 90,
      });

      results.forEach((result) => {
        expect(result.format).toBe('avif');
      });
    });
  });
});
