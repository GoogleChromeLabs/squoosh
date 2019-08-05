import * as wasm from './squooshhqx_bg.wasm';

let cachegetUint32Memory = null;
function getUint32Memory() {
    if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory;
}

let WASM_VECTOR_LEN = 0;

function passArray32ToWasm(arg) {
    const ptr = wasm.__wbindgen_malloc(arg.length * 4);
    getUint32Memory().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachegetInt32Memory = null;
function getInt32Memory() {
    if (cachegetInt32Memory === null || cachegetInt32Memory.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory;
}

function getArrayU32FromWasm(ptr, len) {
    return getUint32Memory().subarray(ptr / 4, ptr / 4 + len);
}
/**
* @param {Uint32Array} input_image
* @param {number} input_width
* @param {number} input_height
* @param {number} factor
* @returns {Uint32Array}
*/
export function resize(input_image, input_width, input_height, factor) {
    const retptr = 8;
    const ret = wasm.resize(retptr, passArray32ToWasm(input_image), WASM_VECTOR_LEN, input_width, input_height, factor);
    const memi32 = getInt32Memory();
    const v0 = getArrayU32FromWasm(memi32[retptr / 4 + 0], memi32[retptr / 4 + 1]).slice();
    wasm.__wbindgen_free(memi32[retptr / 4 + 0], memi32[retptr / 4 + 1] * 4);
    return v0;
}

