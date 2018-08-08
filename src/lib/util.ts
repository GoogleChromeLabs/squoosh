/**
 * A decorator that binds values to their class instance.
 * @example
 * class C {
 *   @bind
 *   foo () {
 *     return this;
 *   }
 * }
 * let f = new C().foo;
 * f() instanceof C;    // true
 */
export function bind(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return {
    // the first time the prototype property is accessed for an instance,
    // define an instance property pointing to the bound function.
    // This effectively "caches" the bound prototype method as an instance property.
    get() {
      const bound = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound,
      });
      return bound;
    },
  };
}

/** Creates a function ref that assigns its value to a given property of an object.
 *  @example
 *  // element is stored as `this.foo` when rendered.
 *  <div ref={linkRef(this, 'foo')} />
 */
export function linkRef<T>(obj: any, name: string) {
  const refName = `$$ref_${name}`;
  let ref = obj[refName];
  if (!ref) {
    ref = obj[refName] = (c: T) => {
      obj[name] = c;
    };
  }
  return ref;
}

/**
 * Turns a given `ImageBitmap` into `ImageData`.
 */
export async function bitmapToImageData(bitmap: ImageBitmap): Promise<ImageData> {
  // Make canvas same size as image
  // TODO: Move this off-thread if possible with `OffscreenCanvas` or iFrames?
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  // Draw image onto canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

export async function imageDataToBitmap(data: ImageData): Promise<ImageBitmap> {
  // Make canvas same size as image
  // TODO: Move this off-thread if possible with `OffscreenCanvas` or iFrames?
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  // Draw image onto canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  ctx.putImageData(data, 0, 0);
  return createImageBitmap(canvas);
}

/** Replace the contents of a canvas with the given bitmap */
export function drawBitmapToCanvas(canvas: HTMLCanvasElement, bitmap: ImageBitmap) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas not initialized');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
}

export async function canvasEncode(data: ImageData, type: string, quality?: number) {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas not initialized');
  ctx.putImageData(data, 0, 0);

  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, type, quality));

  if (!blob) throw Error('Encoding failed');
  return blob;
}

export function canDecodeImage(data: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = data;
    img.onload = _ => resolve(true);
    img.onerror = _ => resolve(false);
  });
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      resolve(fileReader.result);
    });
    fileReader.readAsArrayBuffer(blob);
  });
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
  [/^RIFF....WEBPVP8 /, 'image/webp'],
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

export function createImageBitmapPolyfill(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
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
  return Number((field as HTMLInputElement).checked);
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
