import { ProcessorState } from 'client/lazy-app/feature-meta';
import { assertSignal } from 'client/lazy-app/util';
import WorkerBridge from 'client/lazy-app/worker-bridge';
import { resize } from 'features/processors/resize/client';
import { SourceImage } from '..';

export async function processImage(
  signal: AbortSignal,
  source: SourceImage,
  processorState: ProcessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let result = source.preprocessed;

  if (processorState.resize.enabled) {
    result = await resize(signal, source, processorState.resize, workerBridge);
  }
  if (processorState.quantize.enabled) {
    result = await workerBridge.quantize(
      signal,
      result,
      processorState.quantize,
    );
  }
  return result;
}
