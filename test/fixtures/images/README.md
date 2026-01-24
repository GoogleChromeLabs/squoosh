# Test Image Fixtures

This directory contains test images used for compression testing and validation.

## Images

The following test images are used:

### test-photo.jpg

- **Type:** Photograph
- **Expected Size:** ~2MB
- **Format:** JPEG
- **Purpose:** Test photographic image compression with various quality settings

### test-graphic.png

- **Type:** Graphic/Logo
- **Expected Size:** ~500KB
- **Format:** PNG
- **Purpose:** Test graphics compression with transparency and sharp edges

### test-small.jpg

- **Type:** Small photograph
- **Expected Size:** ~100KB
- **Format:** JPEG
- **Purpose:** Test compression on smaller images

### test-large.jpg

- **Type:** Large photograph
- **Expected Size:** ~5MB
- **Format:** JPEG
- **Purpose:** Test compression performance on large images

## Usage

These images are automatically downloaded or generated during CI runs. For local testing:

```bash
# Images will be created during the image-compression-test workflow
# Or manually create test images using the workflow script
```

## Notes

- Test images are generated automatically in CI using ImageMagick if available
- Placeholder binary files are created if ImageMagick is not present
- These files are marked as binary in `.gitattributes` to prevent diff issues
- Real test images can be added manually for more realistic testing

## Adding New Test Images

To add new test images:

1. Place the image in this directory
2. Update this README with details about the image
3. Add the image to `.gitattributes` if it's binary
4. Update the compression test workflow to include the new image
