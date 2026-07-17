import * as ort from 'onnxruntime-web/webgpu';
import wasmLoaderUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs';
import wasmUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm';
import { readCachedBen2ModelBytes } from '../shared/model-cache';
import { applyMatte, makeNormalizedInput } from '../shared/preprocessing';

const INPUT_SIZE = 1024;
const CAPABILITY_ERROR = 'Ben2CapabilityError';
const TERMINAL_ERROR = 'Ben2TerminalError';

let sessionPromise: Promise<ort.InferenceSession> | undefined;
let session: ort.InferenceSession | undefined;
let terminalReason: string | undefined;

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function capabilityError(message: string): Error {
  return namedError(CAPABILITY_ERROR, message);
}

function terminalError(message: string): Error {
  return namedError(TERMINAL_ERROR, message);
}

async function requireWebGpuAdapter(): Promise<any> {
  if (!(globalThis as any).isSecureContext) {
    throw capabilityError('BEN2 requires a secure context');
  }
  const gpu = (navigator as any).gpu;
  if (!gpu) throw capabilityError('BEN2 requires WebGPU');

  let adapter: any;
  try {
    adapter = await gpu.requestAdapter({ forceFallbackAdapter: false });
  } catch (error) {
    throw capabilityError(
      `BEN2 could not request a WebGPU adapter: ${messageFrom(error)}`,
    );
  }
  if (!adapter) {
    throw capabilityError('BEN2 could not acquire a WebGPU adapter');
  }
  if (!adapter.features?.has('shader-f16')) {
    throw capabilityError('BEN2 requires the WebGPU shader-f16 feature');
  }

  let probeDevice: any;
  try {
    probeDevice = await adapter.requestDevice({
      requiredFeatures: ['shader-f16'],
    });
    probeDevice.destroy();
  } catch (error) {
    if (probeDevice) {
      try {
        probeDevice.destroy();
      } catch {}
    }
    throw capabilityError(
      `BEN2 could not create the required WebGPU device: ${messageFrom(error)}`,
    );
  }
  return adapter;
}

async function invalidate(reason: string): Promise<void> {
  terminalReason ||= reason;
  sessionPromise = undefined;
  const oldSession = session;
  session = undefined;
  if (oldSession) {
    try {
      await oldSession.release();
    } catch {}
  }
}

async function createSession(): Promise<ort.InferenceSession> {
  const adapter = await requireWebGpuAdapter();

  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = {
    mjs: new URL(wasmLoaderUrl, location.href).href,
    wasm: new URL(wasmUrl, location.href).href,
  };
  ort.env.webgpu.adapter = adapter;

  const model = await readCachedBen2ModelBytes();
  let created: ort.InferenceSession;
  try {
    created = await ort.InferenceSession.create(model, {
      executionProviders: ['webgpu'],
      graphOptimizationLevel: 'disabled',
    });
  } catch (error) {
    const reason = `BEN2 session creation failed: ${messageFrom(error)}`;
    await invalidate(reason);
    throw terminalError(reason);
  }

  session = created;
  try {
    const device: any = await ort.env.webgpu.device;
    device.lost.then(
      (info: any) => {
        const detail = info?.message || info?.reason || 'unknown reason';
        void invalidate(`BEN2 WebGPU device was lost: ${detail}`);
      },
      (error: unknown) => {
        void invalidate(
          `BEN2 WebGPU device loss could not be observed: ${messageFrom(
            error,
          )}`,
        );
      },
    );
  } catch (error) {
    const reason = `BEN2 WebGPU device setup failed: ${messageFrom(error)}`;
    await invalidate(reason);
    throw terminalError(reason);
  }

  return created;
}

function getSession(): Promise<ort.InferenceSession> {
  if (terminalReason) return Promise.reject(terminalError(terminalReason));
  if (!sessionPromise) {
    const pending = createSession();
    sessionPromise = pending;
    void pending.catch(() => {
      if (sessionPromise === pending) sessionPromise = undefined;
    });
  }
  return sessionPromise!;
}

export default async function ben2(data: ImageData): Promise<ImageData> {
  const input = makeNormalizedInput(
    data.data,
    data.width,
    data.height,
    INPUT_SIZE,
  );
  const activeSession = await getSession();

  try {
    const output = await activeSession.run({
      pixel_values: new ort.Tensor('float32', input, [
        1,
        3,
        INPUT_SIZE,
        INPUT_SIZE,
      ]),
    });
    if (terminalReason) throw terminalError(terminalReason);
    return applyMatte(data, output.alphas.data as Float32Array, INPUT_SIZE);
  } catch (error) {
    if ((error as Error)?.name === TERMINAL_ERROR) throw error;
    const reason = `BEN2 inference failed: ${messageFrom(error)}`;
    await invalidate(reason);
    throw terminalError(reason);
  }
}
