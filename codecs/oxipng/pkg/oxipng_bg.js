
const path = require('path').join(__dirname, 'oxipng_bg.wasm');
const bytes = require('fs').readFileSync(path);
let imports = {};
imports['./oxipng'] = require('./oxipng');

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
module.exports = wasmInstance.exports;
