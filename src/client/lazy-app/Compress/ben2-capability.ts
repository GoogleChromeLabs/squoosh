export type Ben2Capability =
  | { state: 'checking' }
  | { state: 'supported' }
  | { state: 'unsupported'; reason: string };

interface ProbeDevice {
  destroy(): void;
}

interface ProbeAdapter {
  features: { has(feature: string): boolean };
  requestDevice(options: { requiredFeatures: string[] }): Promise<ProbeDevice>;
}

interface ProbeGpu {
  requestAdapter(options: {
    forceFallbackAdapter: false;
  }): Promise<ProbeAdapter | null>;
}

interface ProbeEnvironment {
  isSecureContext: boolean;
  gpu?: ProbeGpu;
}

function browserEnvironment(): ProbeEnvironment {
  return {
    isSecureContext: globalThis.isSecureContext,
    gpu: (navigator as any).gpu,
  };
}

export async function probeBen2Capability(
  environment: ProbeEnvironment = browserEnvironment(),
): Promise<Ben2Capability> {
  if (!environment.isSecureContext) {
    return {
      state: 'unsupported',
      reason: 'Background removal requires a secure context.',
    };
  }
  if (!environment.gpu) {
    return {
      state: 'unsupported',
      reason: 'Background removal requires WebGPU.',
    };
  }

  let adapter: ProbeAdapter | null;
  try {
    adapter = await environment.gpu.requestAdapter({
      forceFallbackAdapter: false,
    });
  } catch {
    return {
      state: 'unsupported',
      reason: 'A WebGPU adapter could not be created.',
    };
  }
  if (!adapter) {
    return {
      state: 'unsupported',
      reason: 'A WebGPU adapter is not available.',
    };
  }
  if (!adapter.features.has('shader-f16')) {
    return {
      state: 'unsupported',
      reason: 'The WebGPU adapter does not support shader-f16.',
    };
  }

  try {
    const device = await adapter.requestDevice({
      requiredFeatures: ['shader-f16'],
    });
    device.destroy();
  } catch {
    return {
      state: 'unsupported',
      reason: 'A required WebGPU device could not be created.',
    };
  }

  return { state: 'supported' };
}
