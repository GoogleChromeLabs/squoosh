/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @param {number} level
* @returns {Uint8Array}
*/
export function optimise(data: Uint8Array, level: number): Uint8Array;
/**
* @param {number} num
* @returns {any}
*/
export function worker_initializer(num: number): any;
/**
*/
export function start_main_thread(): void;
/**
*/
export function start_worker_thread(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly optimise: (a: number, b: number, c: number, d: number) => void;
  readonly malloc: (a: number) => number;
  readonly free: (a: number) => void;
  readonly worker_initializer: (a: number) => number;
  readonly start_main_thread: () => void;
  readonly start_worker_thread: () => void;
  readonly __wbindgen_export_0: WebAssembly.Memory;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
* @param {WebAssembly.Memory} maybe_memory
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>, maybe_memory?: WebAssembly.Memory): Promise<InitOutput>;
        