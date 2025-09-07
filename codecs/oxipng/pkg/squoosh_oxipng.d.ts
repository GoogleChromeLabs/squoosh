/* tslint:disable */
/* eslint-disable */

import { Deflaters } from "features/encoders/oxiPNG/shared/meta";

/**
* @param {Uint8ClampedArray} data
* @param {number} width
* @param {number} height
* @param {number} level
* @param {boolean} interlace
* @param {Deflaters} deflater
* @param {number} iterations
* @param {number} compressionLevel
* @returns {Uint8Array}
*/
export function optimise(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  level: number, 
  interlace: boolean,
  deflater: Deflaters, 
  iterations: number, 
  compressionLevel: number,
): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly optimise: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
