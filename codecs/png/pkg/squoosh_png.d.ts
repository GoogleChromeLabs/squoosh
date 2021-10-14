/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @param {number} width
* @param {number} height
* @returns {Uint8Array}
*/
export function encode(data: Uint8Array, width: number, height: number): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {ImageData}
*/
export function decode(data: Uint8Array): ImageData;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly encode: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly decode: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
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
