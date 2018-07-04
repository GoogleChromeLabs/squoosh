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

export function canDecode(data: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = data;
    img.onload = _ => resolve(true);
    img.onerror = _ => resolve(false);
  });
}

export function fileToBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
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
