/* tslint:disable */
/**
* @param {Uint32Array} input_image 
* @param {number} input_width 
* @param {number} input_height 
* @param {number} factor 
* @returns {Uint32Array} 
*/
export function resize(input_image: Uint32Array, input_width: number, input_height: number, factor: number): Uint32Array;

/**
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        