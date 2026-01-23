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
  });
});
