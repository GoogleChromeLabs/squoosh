import { canvasEncode } from 'client/lazy-app/util';
import WorkerBridge from 'client/lazy-app/worker-bridge';
import { mimeType, EncodeOptions } from '../shared/meta';

export const encode = (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) => canvasEncode(imageData, mimeType, options.quality);
