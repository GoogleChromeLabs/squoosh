/** Compare two objects, returning a boolean indicating if
 *  they have the same properties and strictly equal values.
 */
export function shallowEqual(one: any, two: any) {
  for (const i in one) if (one[i] !== two[i]) return false;
  for (const i in two) if (!(i in one)) return false;
  return true;
}

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
export async function canvasEncode(data: ImageData, type: string, quality?: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas not initialized');
  ctx.putImageData(data, 0, 0);

  let blob: Blob | null;

  if ('toBlob' in canvas) {
    blob = await new Promise<Blob | null>(r => canvas.toBlob(r, type, quality));
  } else {
    // Welcome to Edge.
    // TypeScript things `canvas` is 'never', so it needs casting.
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

/**
 * Attempts to load the given URL as an image.
 */
export function canDecodeImage(data: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = data;
    img.onload = _ => resolve(true);
    img.onerror = _ => resolve(false);
  });
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Response(blob).arrayBuffer();
}

export function blobToText(blob: Blob): Promise<string> {
  return new Response(blob).text();
}

const magicNumberToMimeType = new Map<RegExp, string>([
  [/^%PDF-/, 'application/pdf'],
  [/^GIF87a/, 'image/gif'],
  [/^GIF89a/, 'image/gif'],
  [/^\x89PNG\x0D\x0A\x1A\x0A/, 'image/png'],
  [/^\xFF\xD8\xFF/, 'image/jpeg'],
  [/^BM/, 'image/bmp'],
  [/^I I/, 'image/tiff'],
  [/^II*/, 'image/tiff'],
  [/^MM\x00*/, 'image/tiff'],
  [/^RIFF....WEBPVP8[LX ]/, 'image/webp'],
]);

export async function sniffMimeType(blob: Blob): Promise<string> {
  const firstChunk = await blobToArrayBuffer(blob.slice(0, 16));
  const firstChunkString =
    Array.from(new Uint8Array(firstChunk))
      .map(v => String.fromCodePoint(v))
      .join('');
  for (const [detector, mimeType] of magicNumberToMimeType) {
    if (detector.test(firstChunkString)) {
      return mimeType;
    }
  }
  return '';
}

export async function blobToImg(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;

    if (img.decode) {
      // Nice off-thread way supported in at least Safari.
      await img.decode();
    } else {
      // Main thread decoding :(
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(Error('Image loading error'));
      });
    }

    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
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

export async function nativeDecode(blob: Blob): Promise<ImageData> {
  // Prefer createImageBitmap as it's the off-thread option for Firefox.
  const drawable = 'createImageBitmap' in self ?
    await createImageBitmap(blob) : await blobToImg(blob);

  return drawableToImageData(drawable);
}

export type NativeResizeMethod = 'pixelated' | 'low' | 'medium' | 'high';

export function nativeResize(
  data: ImageData,
  sx: number, sy: number, sw: number, sh: number,
  dw: number, dh: number,
  method: NativeResizeMethod,
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
 * @param field An HTMLInputElement, but the casting is done here to tidy up onChange.
 */
export function inputFieldValueAsNumber(field: any): number {
  return Number((field as HTMLInputElement).value);
}

/**
 * @param field An HTMLInputElement, but the casting is done here to tidy up onChange.
 */
export function inputFieldCheckedAsNumber(field: any): number {
  return Number(inputFieldChecked(field));
}

/**
 * @param field An HTMLInputElement, but the casting is done here to tidy up onChange.
 */
export function inputFieldChecked(field: any): boolean {
  return (field as HTMLInputElement).checked;
}

/**
 * Creates a promise that resolves when the user types the konami code.
 */
export function konami(): Promise<void> {
  return new Promise((resolve) => {
    // Keycodes for: ↑ ↑ ↓ ↓ ← → ← → B A
    const expectedPattern = '38384040373937396665';
    let rollingPattern = '';

    const listener = (event: KeyboardEvent) => {
      rollingPattern += event.keyCode;
      rollingPattern = rollingPattern.slice(-expectedPattern.length);
      if (rollingPattern === expectedPattern) {
        window.removeEventListener('keydown', listener);
        resolve();
      }
    };

    window.addEventListener('keydown', listener);
  });
}
