# WordPress Integration Guide

This guide explains how to integrate Squoosh's image compression capabilities into your WordPress plugin.

## Overview

The WordPress integration module provides a set of APIs designed specifically for WordPress image processing workflows. It supports:

- Single and batch image compression
- Multiple modern formats (WebP, AVIF, JPEG XL)
- Thumbnail generation for WordPress image sizes
- Batch processing with progress tracking

## Installation

The WordPress integration module is included in Squoosh. To use it in your WordPress plugin:

```typescript
import { 
  compressImage, 
  compressImageBatch,
  generateThumbnails,
  batchProcessor 
} from 'wordpress';
```

## API Reference

### compressImage

Compress a single image with specified options.

```typescript
async function compressImage(
  imageData: ArrayBuffer | Blob,
  options?: CompressionOptions
): Promise<CompressionResult>
```

**Parameters:**
- `imageData`: The image to compress (ArrayBuffer or Blob)
- `options`: Compression options
  - `format`: Target format ('webp', 'avif', 'mozjpeg', 'oxipng', 'jxl')
  - `quality`: Quality level (0-100)
  - `effort`: Compression effort (0-9)
  - `lossless`: Enable lossless compression

**Returns:**
- `CompressionResult` with compression statistics and output data

**Example:**

```typescript
const imageBuffer = await fetchImage('photo.jpg');

const result = await compressImage(imageBuffer, {
  format: 'webp',
  quality: 80,
  effort: 4,
});

console.log(`Compressed: ${result.originalSize} → ${result.compressedSize}`);
console.log(`Saved: ${(result.compressionRatio * 100).toFixed(1)}%`);
```

### compressImageBatch

Compress multiple images in sequence.

```typescript
async function compressImageBatch(
  images: (ArrayBuffer | Blob)[],
  options?: CompressionOptions
): Promise<CompressionResult[]>
```

**Example:**

```typescript
const images = await fetchMultipleImages(['img1.jpg', 'img2.png', 'img3.jpg']);

const results = await compressImageBatch(images, {
  format: 'avif',
  quality: 85,
});

results.forEach((result, i) => {
  console.log(`Image ${i + 1}: ${result.compressionRatio * 100}% saved`);
});
```

### generateThumbnails

Generate WordPress image size variations.

```typescript
async function generateThumbnails(
  imageData: ArrayBuffer | Blob,
  sizes: WordPressImageSizes,
  options?: CompressionOptions
): Promise<ThumbnailResult[]>
```

**Example:**

```typescript
const wpSizes = {
  thumbnail: { width: 150, height: 150, crop: true },
  medium: { width: 300, height: 300, crop: false },
  large: { width: 1024, height: 1024, crop: false },
};

const thumbnails = await generateThumbnails(imageBuffer, wpSizes, {
  format: 'webp',
  quality: 80,
});

thumbnails.forEach(thumb => {
  console.log(`${thumb.size}: ${thumb.width}x${thumb.height}`);
});
```

### batchProcessor

Process multiple images with controlled concurrency and progress tracking.

```typescript
async function batchProcessor(
  images: (ArrayBuffer | Blob)[],
  options?: BatchProcessOptions,
  compressionOptions?: CompressionOptions
): Promise<BatchProcessResult>
```

**Example:**

```typescript
const images = await fetchManyImages();

const result = await batchProcessor(
  images,
  {
    concurrency: 4, // Process 4 images at a time
    onProgress: (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    },
    onError: (error, index) => {
      console.error(`Failed on image ${index}:`, error);
    },
  },
  {
    format: 'avif',
    quality: 85,
  }
);

console.log(`Success: ${result.successful}, Failed: ${result.failed}`);
```

## Type Definitions

### CompressionOptions

```typescript
interface CompressionOptions {
  format?: 'webp' | 'avif' | 'mozjpeg' | 'oxipng' | 'jxl';
  quality?: number;
  effort?: number;
  lossless?: boolean;
}
```

### CompressionResult

```typescript
interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: ArrayBuffer;
  format: string;
  width: number;
  height: number;
}
```

### WordPressImageSizes

```typescript
interface WordPressImageSizes {
  thumbnail: WordPressImageSize;
  medium: WordPressImageSize;
  large: WordPressImageSize;
  [key: string]: WordPressImageSize;
}

interface WordPressImageSize {
  width: number;
  height: number;
  crop: boolean;
}
```

## WordPress Plugin Example

Here's a complete example of using Squoosh in a WordPress plugin:

```php
// PHP side - enqueue the module
function enqueue_squoosh_module() {
  wp_enqueue_script(
    'squoosh-wordpress',
    plugins_url('js/squoosh-wordpress.js', __FILE__),
    [],
    '1.0.0',
    true
  );
}
add_action('admin_enqueue_scripts', 'enqueue_squoosh_module');
```

```typescript
// JavaScript/TypeScript side - squoosh-wordpress.js
import { compressImage } from 'wordpress';

async function compressWordPressUpload(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await compressImage(arrayBuffer, {
      format: 'webp',
      quality: 80,
    });

    // Create blob from result
    const blob = new Blob([result.data], { type: 'image/webp' });
    
    // Upload to WordPress media library
    const formData = new FormData();
    formData.append('file', blob, file.name.replace(/\.[^.]+$/, '.webp'));
    
    const response = await fetch('/wp-json/wp/v2/media', {
      method: 'POST',
      body: formData,
      headers: {
        'X-WP-Nonce': wpApiSettings.nonce,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
}
```

## Best Practices

1. **Choose the right format**:
   - WebP: Best browser support, good compression
   - AVIF: Better compression, growing browser support
   - JPEG XL: Excellent quality, limited browser support

2. **Quality settings**:
   - 80-85: Good balance for most images
   - 90+: High quality for critical images
   - 60-75: Aggressive compression for thumbnails

3. **Batch processing**:
   - Use `batchProcessor` for multiple images
   - Set appropriate concurrency (4-8 typically)
   - Implement progress feedback for users

4. **Error handling**:
   - Always handle compression failures gracefully
   - Provide fallback to original images
   - Log errors for debugging

## Performance Tips

- Process images client-side when possible to reduce server load
- Use Web Workers for non-blocking compression
- Cache compression results to avoid reprocessing
- Consider progressive compression for large batches

## Support

For issues or questions:
- GitHub Issues: https://github.com/GoogleChromeLabs/squoosh
- Documentation: https://squoosh.app

## License

Apache 2.0 - See LICENSE file
