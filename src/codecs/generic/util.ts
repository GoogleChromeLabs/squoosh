import { canvasEncode } from '../../lib/util';

export async function canvasEncodeTest(mimeType: string) {
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
