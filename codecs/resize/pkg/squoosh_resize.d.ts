/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} input_image
* @param {number} input_width
* @param {number} input_height
* @param {number} output_width
* @param {number} output_height
* @param {number} typ_idx
* @param {boolean} premultiply
* @param {boolean} color_space_conversion
* @returns {Uint8ClampedArray}
*/
export function resize(input_image: Uint8Array, input_width: number, input_height: number, output_width: number, output_height: number, typ_idx: number, premultiply: boolean, color_space_conversion: boolean): Uint8ClampedArray;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly resize: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
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

export function cleanup(): void;
