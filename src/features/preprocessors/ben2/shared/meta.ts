/**
 * BEN2 worker/cache architecture spike only. Not production-ready.
 */
export interface Options {
  enabled: boolean;
}

export const defaultOptions: Options = {
  enabled: false,
};

export interface Diagnostics {
  modelUrl: string;
  wasmLoaderUrl: string;
  wasmUrl: string;
  workerUrl: string;
  workerStartedAt: number;
  sessionCreateCount: number;
  runCount: number;
  sessionCreationMs: number;
  inferenceMs: number;
}

export interface Result {
  imageData: ImageData;
  diagnostics: Diagnostics;
}
