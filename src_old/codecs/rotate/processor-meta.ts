export interface RotateOptions {
  rotate: 0 | 90 | 180 | 270;
}

export const defaultOptions: RotateOptions = { rotate: 0 };

export interface RotateModuleInstance {
  exports: {
    memory: WebAssembly.Memory;
    rotate(width: number, height: number, rotate: 0 | 90 | 180 | 270): void;
  };
}
