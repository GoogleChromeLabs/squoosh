export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'image/jxl',
  'image/webp2',
  'image/qoi',
] as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileSize(blob: Blob): ValidationResult {
  if (blob.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }
  return { valid: true };
}

export function validateMimeType(blob: Blob): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(blob.type as any)) {
    return {
      valid: false,
      error: `Unsupported file type: ${blob.type}`,
    };
  }
  return { valid: true };
}

export async function validateImageHeader(
  blob: Blob,
): Promise<ValidationResult> {
  try {
    const header = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(header);

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      return { valid: true };

    // PNG: 89 50 4E 47
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
      return { valid: true };

    // WebP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
      return { valid: true };

    // SVG
    if (
      bytes[0] === 0x3c ||
      (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
    )
      return { valid: true };

    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)
      return { valid: true };

    return { valid: false, error: 'Invalid image file format' };
  } catch (err) {
    return {
      valid: false,
      error: `Validation error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function validateImage(blob: Blob): Promise<ValidationResult> {
  const sizeResult = validateFileSize(blob);
  if (!sizeResult.valid) return sizeResult;

  const mimeResult = validateMimeType(blob);
  if (!mimeResult.valid) return mimeResult;

  const headerResult = await validateImageHeader(blob);
  if (!headerResult.valid) return headerResult;

  return { valid: true };
}
