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

    it('should accept files at exactly max size', () => {
      const blob = new Blob(['x'.repeat(MAX_FILE_SIZE)]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept empty files', () => {
      const blob = new Blob([]);
      const result = validateFileSize(blob);
      expect(result.valid).toBe(true);
    });

    it('should format error message with MB units', () => {
      const blob = new Blob(['x'.repeat(MAX_FILE_SIZE + 1)]);
      const result = validateFileSize(blob);
      expect(result.error).toContain('MB');
      expect(result.error).toContain('max');
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

    it('should accept PNG', () => {
      const blob = new Blob([], { type: 'image/png' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP', () => {
      const blob = new Blob([], { type: 'image/webp' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept AVIF', () => {
      const blob = new Blob([], { type: 'image/avif' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept GIF', () => {
      const blob = new Blob([], { type: 'image/gif' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept SVG', () => {
      const blob = new Blob([], { type: 'image/svg+xml' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should accept JXL', () => {
      const blob = new Blob([], { type: 'image/jxl' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(true);
    });

    it('should reject video types', () => {
      const blob = new Blob([], { type: 'video/mp4' });
      const result = validateMimeType(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject text types', () => {
      const blob = new Blob([], { type: 'text/plain' });
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
      // RIFF....WEBP format
      const bytes = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // file size
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

    it('should validate SVG with BOM', async () => {
      const bytes = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid magic bytes', async () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image file format');
    });

    it('should reject AVIF header (not implemented)', async () => {
      // AVIF starts with ftyp
      const bytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70,
      ]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should reject JXL header (not implemented)', async () => {
      // JXL starts with FF 0A or 00 00 00 0C
      const bytes = new Uint8Array([0xff, 0x0a]);
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle corrupted data', async () => {
      const bytes = new Uint8Array([0xff, 0xd8]); // Incomplete JPEG
      const blob = new Blob([bytes]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle empty files', async () => {
      const blob = new Blob([]);
      const result = await validateImageHeader(blob);
      expect(result.valid).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Create a blob that might cause errors
      const blob = new Blob(['not an image']);
      const result = await validateImageHeader(blob);
      // Should return valid: false with an error message
      expect(result.valid).toBe(false);
    });
  });
});
