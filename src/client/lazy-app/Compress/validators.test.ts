import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateMimeType,
  validateImageHeader,
  MAX_FILE_SIZE,
} from './validators';

describe('Image Validators', () => {
  describe('validateFileSize', () => {
    it('should accept files under max size', () => {
      const blob = new Blob(['x'.repeat(1000)]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(true);
    });

    it('should reject files over max size', () => {
      const blob = new Blob(['x'.repeat(MAX_FILE_SIZE + 1)]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should handle empty files', () => {
      const blob = new Blob([]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(true);
      expect(blob.size).toBe(0);
    });

    it('should handle extremely large files', () => {
      // Create a blob that simulates an extremely large file
      const largeSize = MAX_FILE_SIZE * 2;
      const blob = new Blob(['x'.repeat(largeSize)]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should show file size in error message', () => {
      const blob = new Blob(['x'.repeat(MAX_FILE_SIZE + 1000)]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\d+\.?\d*MB/);
    });
  });

  describe('validateMimeType', () => {
    it('should accept valid image types', () => {
      const blob = new Blob([], { type: 'image/jpeg' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid types', () => {
      const blob = new Blob([], { type: 'application/pdf' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(false);
    });

    it('should accept all supported image formats', () => {
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif',
        'image/svg+xml',
        'image/jxl',
        'image/webp2',
        'image/qoi',
      ];

      supportedTypes.forEach((type) => {
        const blob = new Blob([], { type });
        const result = validateMimeType(blob);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject video formats', () => {
      const blob = new Blob([], { type: 'video/mp4' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject text formats', () => {
      const blob = new Blob([], { type: 'text/plain' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle empty mime type', () => {
      const blob = new Blob([]);
      const result = validateMimeType(blob);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateImageHeader', () => {
    it('should validate JPEG magic bytes', async () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should validate PNG magic bytes', async () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should validate WebP magic bytes', async () => {
      // WebP: RIFF....WEBP
      const bytes = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // file size (placeholder)
        0x57,
        0x45,
        0x42,
        0x50, // WEBP
      ]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should validate GIF magic bytes', async () => {
      const bytes = new Uint8Array([0x47, 0x49, 0x46]); // GIF
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should validate SVG starting with <', async () => {
      const bytes = new Uint8Array([0x3c]); // <
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should validate SVG with UTF-8 BOM', async () => {
      const bytes = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should detect AVIF header', async () => {
      // AVIF files start with ftyp box after initial bytes
      // This test verifies unsupported format detection
      const bytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66,
      ]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      // Should be invalid as it doesn't match known patterns
      expect(result.valid).toBe(false);
    });

    it('should detect JXL header', async () => {
      // JXL files start with specific magic bytes
      const bytes = new Uint8Array([
        0xff,
        0x0a, // JXL signature
      ]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      // Should be invalid as it doesn't match known patterns
      expect(result.valid).toBe(false);
    });

    it('should reject corrupted image data', async () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image file format');
    });

    it('should reject random binary data', async () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle blob with insufficient data', async () => {
      const bytes = new Uint8Array([0xff]); // Only 1 byte
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle various JPEG markers', async () => {
      // JPEG with different markers
      const markers = [
        [0xff, 0xd8, 0xff, 0xe0], // JFIF
        [0xff, 0xd8, 0xff, 0xe1], // EXIF
        [0xff, 0xd8, 0xff, 0xe2], // ICC
      ];

      for (const marker of markers) {
        const bytes = new Uint8Array(marker);
        const blob = new Blob([bytes]);
        const result = await validateImageHeader(blob);
        expect(result.valid).toBe(true);
      }
    });

    it('should handle error during validation', async () => {
      // Create a mock blob that throws an error
      const mockBlob = {
        slice: () => {
          throw new Error('Slice error');
        },
      } as any;

      const result = await validateImageHeader(mockBlob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Validation error');
    });
  });
});
