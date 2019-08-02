/* tslint:disable */
/**
* @param {Uint8Array} input_image 
* @param {number} input_width 
* @param {number} input_height 
* @param {number} output_width 
* @param {number} output_height 
* @param {number} typ_idx 
* @param {boolean} premultiply 
* @param {boolean} color_space_conversion 
* @returns {Uint8Array} 
*/
export function resize(input_image: Uint8Array, input_width: number, input_height: number, output_width: number, output_height: number, typ_idx: number, premultiply: boolean, color_space_conversion: boolean): Uint8Array;

/**
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        