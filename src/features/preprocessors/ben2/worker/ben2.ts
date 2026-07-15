/**
 * BEN2 worker/cache architecture spike only. Not production-ready.
 */
import * as ort from 'onnxruntime-web/webgpu';
import wasmLoaderUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs';
import wasmUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm';
import modelUrl from 'url:../../../../../.tmp/ben2/model_fp16.onnx';
import { Diagnostics, Result } from '../shared/meta';

const INPUT_SIZE = 1024;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const workerStartedAt = Date.now();

let sessionPromise: Promise<ort.InferenceSession> | undefined;
let sessionCreateCount = 0;
let sessionCreationMs = 0;
let runCount = 0;

function gpuAdapterDetails(adapter: any) {
  const info = (adapter as any).info || {};
  return {
    info: { ...info },
    isFallbackAdapter: info.isFallbackAdapter ?? null,
    features: [...adapter.features].sort(),
    limits: Object.fromEntries(
      Object.getOwnPropertyNames(Object.getPrototypeOf(adapter.limits))
        .filter((name) => name !== 'constructor')
        .map((name) => [name, (adapter.limits as any)[name]]),
    ),
  };
}

async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionCreateCount++;
    const started = performance.now();
    // The dedicated WebGPU entry uses the asyncify artifact. Keep ORT's host
    // single-threaded; WebGPU owns graph execution and needs no pthread child.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = {
      mjs: new URL(wasmLoaderUrl, location.href).href,
      wasm: new URL(wasmUrl, location.href).href,
    };
    ort.env.logLevel = 'verbose';

    console.log('[BEN2 WebGPU spike] adapter request start', {
      workerStartedAt,
      powerPreference: 'high-performance',
      forceFallbackAdapter: false,
    });
    const adapter = await (navigator as any).gpu.requestAdapter({
      powerPreference: 'high-performance',
      forceFallbackAdapter: false,
    });
    if (!adapter)
      throw new Error('navigator.gpu.requestAdapter() returned null');
    const adapterDetails = gpuAdapterDetails(adapter);
    console.log('[BEN2 WebGPU spike] adapter acquired', adapterDetails);
    ort.env.webgpu.adapter = adapter;

    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['webgpu', 'wasm'],
      graphOptimizationLevel: 'disabled',
      logSeverityLevel: 0,
      logVerbosityLevel: 4,
    };
    console.log('[BEN2 WebGPU spike] session creation start', {
      modelUrl,
      wasmLoaderUrl,
      wasmUrl,
      options,
    });
    sessionPromise = ort.InferenceSession.create(modelUrl, options)
      .then(async (session) => {
        sessionCreationMs = performance.now() - started;
        const device: any = await ort.env.webgpu.device;
        if (device) {
          device.lost.then((info: any) =>
            console.error('[BEN2 WebGPU spike] device lost', {
              reason: info.reason,
              message: info.message,
            }),
          );
          device.addEventListener('uncapturederror', (event: any) =>
            console.error('[BEN2 WebGPU spike] uncaptured device error', {
              message: event.error?.message,
            }),
          );
        }
        console.log('[BEN2 WebGPU spike] session created', {
          workerStartedAt,
          sessionCreateCount,
          sessionCreationMs,
          adapterDetails,
          deviceFeatures: device ? [...device.features].sort() : [],
          deviceLimits: device
            ? Object.fromEntries(
                Object.getOwnPropertyNames(Object.getPrototypeOf(device.limits))
                  .filter((name) => name !== 'constructor')
                  .map((name) => [name, (device.limits as any)[name]]),
              )
            : {},
        });
        return session;
      })
      .catch((error) => {
        console.error('[BEN2 WebGPU spike] session creation failed', {
          elapsedMs: performance.now() - started,
          name: error?.name,
          message: error?.message || String(error),
          stack: error?.stack,
          adapterDetails,
        });
        throw error;
      });
  }
  return sessionPromise!;
}

function makeInput(data: ImageData): Float32Array {
  const canvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const context = canvas.getContext('2d')!;
  const source = new OffscreenCanvas(data.width, data.height);
  const opaque = new Uint8ClampedArray(data.data);
  for (let pixel = 0; pixel < data.width * data.height; pixel++) {
    opaque[pixel * 4 + 3] = 255;
  }
  source
    .getContext('2d')!
    .putImageData(new ImageData(opaque, data.width, data.height), 0, 0);
  context.drawImage(source, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const rgba = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const planeSize = INPUT_SIZE * INPUT_SIZE;
  const input = new Float32Array(planeSize * 3);

  for (let pixel = 0; pixel < planeSize; pixel++) {
    for (let channel = 0; channel < 3; channel++) {
      input[channel * planeSize + pixel] =
        (rgba[pixel * 4 + channel] / 255 - MEAN[channel]) / STD[channel];
    }
  }
  return input;
}

function applyMatte(source: ImageData, raw: Float32Array): ImageData {
  let min = Infinity;
  let max = -Infinity;
  for (const value of raw) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const needsSigmoid = min < -1e-5 || max > 1.00001;
  const maskBytes = new Uint8ClampedArray(INPUT_SIZE * INPUT_SIZE * 4);
  for (let pixel = 0; pixel < raw.length; pixel++) {
    const probability = needsSigmoid
      ? 1 / (1 + Math.exp(-raw[pixel]))
      : raw[pixel];
    const offset = pixel * 4;
    maskBytes[offset] = 255;
    maskBytes[offset + 1] = 255;
    maskBytes[offset + 2] = 255;
    maskBytes[offset + 3] = probability * 255;
  }

  const maskCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  maskCanvas
    .getContext('2d')!
    .putImageData(new ImageData(maskBytes, INPUT_SIZE, INPUT_SIZE), 0, 0);
  const outputCanvas = new OffscreenCanvas(source.width, source.height);
  const outputContext = outputCanvas.getContext('2d')!;
  outputContext.drawImage(maskCanvas, 0, 0, source.width, source.height);
  const resizedMask = outputContext.getImageData(
    0,
    0,
    source.width,
    source.height,
  ).data;

  const output = new Uint8ClampedArray(source.data);
  for (let pixel = 0; pixel < source.width * source.height; pixel++) {
    output[pixel * 4 + 3] = resizedMask[pixel * 4 + 3];
  }
  return new ImageData(output, source.width, source.height);
}

export default async function ben2(data: ImageData): Promise<Result> {
  const input = makeInput(data);
  const session = await getSession();
  const started = performance.now();
  console.log('[BEN2 WebGPU spike] first inference start', {
    workerStartedAt,
    runNumber: runCount + 1,
  });
  let output: ort.InferenceSession.OnnxValueMapType;
  try {
    output = await session.run({
      pixel_values: new ort.Tensor('float32', input, [
        1,
        3,
        INPUT_SIZE,
        INPUT_SIZE,
      ]),
    });
  } catch (error) {
    console.error('[BEN2 WebGPU spike] inference failed', {
      elapsedMs: performance.now() - started,
      name: (error as any)?.name,
      message: (error as any)?.message || String(error),
      stack: (error as any)?.stack,
    });
    throw error;
  }
  const inferenceMs = performance.now() - started;
  runCount++;
  const diagnostics: Diagnostics = {
    modelUrl,
    wasmLoaderUrl,
    wasmUrl,
    workerUrl: location.href,
    workerStartedAt,
    sessionCreateCount,
    runCount,
    sessionCreationMs,
    inferenceMs,
  };
  console.log('[BEN2 spike] inference complete', diagnostics);
  return {
    imageData: applyMatte(data, output.alphas.data as Float32Array),
    diagnostics,
  };
}
