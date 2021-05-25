import { drawableToImageData } from 'client/lazy-app/util';

const hasImageDecoder = typeof ImageDecoder !== 'undefined';
export async function isTypeSupported(mimeType: string): Promise<boolean> {
  if (!hasImageDecoder) {
    return false;
  }
  return ImageDecoder.isTypeSupported(mimeType);
}
export async function decode(
  blob: Blob | File,
  mimeType: string,
): Promise<ImageData> {
  if (!hasImageDecoder) {
    throw Error(
      `This browser does not support ImageDecoder. This function should not have been called.`,
    );
  }
  const decoder = new ImageDecoder({
    type: mimeType,
    // Non-obvious way to turn an Blob into a ReadableStream
    data: new Response(blob).body!,
  });
  const { image } = await decoder.decode();
  return drawableToImageData(image);
}
