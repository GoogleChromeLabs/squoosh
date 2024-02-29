/** Replace the contents of a canvas with the given data */
export function drawDataToCanvas(canvas: HTMLCanvasElement, data: ImageData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas not initialized');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(data, 0, 0);
}

/**
 * Encode some image data in a given format using the browser's encoders
 *
 * @param {ImageData} data
 * @param {string} type A mime type, eg image/jpeg.
 * @param {number} [quality] Between 0-1.
 */
export async function canvasEncode(
  data: ImageData,
  type: string,
  quality?: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas not initialized');
  ctx.putImageData(data, 0, 0);

  let blob: Blob | null;

  if ('toBlob' in canvas) {
    blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, type, quality),
    );
  } else {
    // Welcome to Edge.
    // TypeScript thinks `canvas` is 'never', so it needs casting.
    const dataUrl = (canvas as HTMLCanvasElement).toDataURL(type, quality);
    const result = /data:([^;]+);base64,(.*)$/.exec(dataUrl);

    if (!result) throw Error('Data URL reading failed');

    const outputType = result[1];
    const binaryStr = atob(result[2]);
    const data = new Uint8Array(binaryStr.length);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = binaryStr.charCodeAt(i);
    }

    blob = new Blob([data], { type: outputType });
  }

  if (!blob) throw Error('Encoding failed');
  return blob;
}

interface DrawableToImageDataOptions {
  width?: number;
  height?: number;
  sx?: number;
  sy?: number;
  sw?: number;
  sh?: number;
}

export function drawableToImageData(
  drawable: ImageBitmap | HTMLImageElement,
  opts: DrawableToImageDataOptions = {},
): ImageData {
  const {
    width = drawable.width,
    height = drawable.height,
    sx = 0,
    sy = 0,
    sw = drawable.width,
    sh = drawable.height,
  } = opts;

  // Make canvas same size as image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // Draw image onto canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  ctx.drawImage(drawable, sx, sy, sw, sh, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export type BuiltinResizeMethod = 'pixelated' | 'low' | 'medium' | 'high';

export function builtinResize(
  data: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  method: BuiltinResizeMethod,
): ImageData {
  const canvasSource = document.createElement('canvas');
  canvasSource.width = data.width;
  canvasSource.height = data.height;
  drawDataToCanvas(canvasSource, data);

  const canvasDest = document.createElement('canvas');
  canvasDest.width = dw;
  canvasDest.height = dh;
  const ctx = canvasDest.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  if (method === 'pixelated') {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingQuality = method;
  }

  ctx.drawImage(canvasSource, sx, sy, sw, sh, 0, 0, dw, dh);
  return ctx.getImageData(0, 0, dw, dh);
}

/**
 * Test whether <canvas> can encode to a particular type.
 */
export async function canvasEncodeTest(mimeType: string): Promise<boolean> {
  try {
    const blob = await canvasEncode(new ImageData(1, 1), mimeType);
    // According to the spec, the blob should be null if the format isn't supported…
    if (!blob) return false;
    // …but Safari & Firefox fall back to PNG, so we need to check the mime type.
    return blob.type === mimeType;
  } catch (err) {
    return false;
  }
}
