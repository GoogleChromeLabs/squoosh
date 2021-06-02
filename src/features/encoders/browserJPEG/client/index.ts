import { canvasEncode } from 'client/lazy-app/util/canvas';
import WorkerBridge from 'client/lazy-app/worker-bridge';
import { qualityOption } from 'features/client-utils';
import { mimeType, EncodeOptions } from '../shared/meta';

export const encode = (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) => canvasEncode(imageData, mimeType, options.quality);

export const Options = qualityOption({ min: 0, max: 1, step: 0.01 });
