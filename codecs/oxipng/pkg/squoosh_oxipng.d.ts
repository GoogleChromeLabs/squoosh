/* tslint:disable */
/* eslint-disable */
/**
* @param {Array<any>} workers
*/
export function start_main_thread(workers: Array<any>): void;
/**
* @param {number} thread
*/
export function start_worker_thread(thread: number): void;
/**
* @param {Uint8Array} data
* @param {number} level
* @returns {Uint8Array}
*/
export function optimise(data: Uint8Array, level: number): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly start_main_thread: (a: number) => void;
  readonly start_worker_thread: (a: number) => void;
  readonly optimise: (a: number, b: number, c: number, d: number) => void;
  readonly malloc: (a: number) => number;
  readonly free: (a: number) => void;
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
export default function init (module_or_path?: InitInput | Promise<InitInput>, maybe_memory: WebAssembly.Memory): Promise<InitOutput>;
        