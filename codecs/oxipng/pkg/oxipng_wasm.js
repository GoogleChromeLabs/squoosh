/* tslint:disable */
var wasm;

/**
* @returns {number}
*/
module.exports.doit = function() {
    return wasm.doit();
};

wasm = require('./oxipng_wasm_bg');
