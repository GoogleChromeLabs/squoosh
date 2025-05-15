import { PreprocessorState } from 'client/lazy-app/feature-meta';
import { assertSignal } from 'client/lazy-app/util';
import WorkerBridge from 'client/lazy-app/worker-bridge';

export async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  preprocessorState: PreprocessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let processedData = data;

  if (preprocessorState.rotate.rotate !== 0) {
    processedData = await workerBridge.rotate(
      signal,
      processedData,
      preprocessorState.rotate,
    );
  }

  return processedData;
}
