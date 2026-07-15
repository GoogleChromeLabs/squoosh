/// <reference path="../../../../../missing-types.d.ts" />

interface HTMLImageElement {}
interface Ben2OffscreenCanvas2D {
  drawImage(source: any, dx: number, dy: number, dw: number, dh: number): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
  putImageData(data: ImageData, dx: number, dy: number): void;
}
interface OffscreenCanvas extends EventTarget {
  width: number;
  height: number;
  getContext(contextId: '2d'): Ben2OffscreenCanvas2D | null;
}
declare var OffscreenCanvas: {
  prototype: OffscreenCanvas;
  new (width: number, height: number): OffscreenCanvas;
};

declare module 'onnxruntime-web/webgpu' {
  export * from 'onnxruntime-web';
}
