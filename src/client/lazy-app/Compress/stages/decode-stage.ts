import {
  abortable,
  assertSignal,
  blobToImg,
  blobToText,
  builtinDecode,
  canDecodeImageType,
  sniffMimeType,
} from 'client/lazy-app/util';
import { drawableToImageData } from 'client/lazy-app/util/canvas';
import WorkerBridge from 'client/lazy-app/worker-bridge';

async function processSvg(
  signal: AbortSignal,
  blob: Blob,
): Promise<HTMLImageElement> {
  assertSignal(signal);
  // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
  // In Chrome it loads, but drawImage behaves weirdly.
  // This function sets width/height if it isn't already set.
  const parser = new DOMParser();
  const text = await abortable(signal, blobToText(blob));
  const document = parser.parseFromString(text, 'image/svg+xml');
  const svg = document.documentElement!;

  if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
    return blobToImg(blob);
  }

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox === null) throw Error('SVG must have width/height or viewBox');

  const viewboxParts = viewBox.split(/\s+/);
  svg.setAttribute('width', viewboxParts[2]);
  svg.setAttribute('height', viewboxParts[3]);

  const serializer = new XMLSerializer();
  const newSource = serializer.serializeToString(document);
  return abortable(
    signal,
    blobToImg(new Blob([newSource], { type: 'image/svg+xml' })),
  );
}

export async function decodeBitmap(
  signal: AbortSignal,
  blob: Blob,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));
  const canDecode = await abortable(signal, canDecodeImageType(mimeType));

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        return await workerBridge.avifDecode(signal, blob);
      }
      if (mimeType === 'image/webp') {
        return await workerBridge.webpDecode(signal, blob);
      }
      if (mimeType === 'image/jxl') {
        return await workerBridge.jxlDecode(signal, blob);
      }
      if (mimeType === 'image/webp2') {
        return await workerBridge.wp2Decode(signal, blob);
      }
      if (mimeType === 'image/qoi') {
        return await workerBridge.qoiDecode(signal, blob);
      }
    }
    // Otherwise fall through and try built-in decoding for a laugh.
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.log(err);
    throw Error("Couldn't decode image");
  }
}

/**
 * Decode an svg or a bitmap image.
 */
export async function decodeImage(
  signal: AbortSignal,
  file: File,
  workerBridge: WorkerBridge,
): Promise<{
  vectorImage?: HTMLImageElement;
  decoded: ImageData;
}> {
  assertSignal(signal);
  // Special-case SVG. We need to avoid createImageBitmap because of
  // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
  // Also, we cache the HTMLImageElement so we can perform vector resizing later.
  if (file.type.startsWith('image/svg+xml')) {
    const vectorImage = await processSvg(signal, file);
    const decoded = drawableToImageData(vectorImage);
    return {
      decoded,
      vectorImage,
    };
  }
  const decoded = await decodeBitmap(signal, file, workerBridge);

  return { decoded };
}
