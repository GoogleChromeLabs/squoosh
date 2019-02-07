// const oxipng = require("./oxipng_wasm");
const repl = require("repl");
const fs = require("fs");

const dec = new TextDecoder();
let buffer = '';
async function init() {
  const { instance } = await WebAssembly.instantiate(
    fs.readFileSync("./target/wasm32-unknown-unknown/release/loltest.wasm"),
    {
      __wbindgen_placeholder__: {
        __wbindgen_describe(v) {
          console.log(`__wbindgen_desribe(${v})`);
        }
      },
      env: {
        // See https://github.com/rust-lang/rust/blob/master/src/libstd/sys/wasm/mod.rs
        rust_wasm_syscall(syscall, ptr) {
          switch(syscall) {
            case 1: // Write
              const [fd, dataPtr, len] = new Uint32Array(instance.exports.memory.buffer, ptr, 3 * 4);
              const fragment = new Uint8Array(instance.exports.memory.buffer, dataPtr, len);
              buffer += dec.decode(fragment);
              const idx = buffer.indexOf('\n');
              if(idx !== -1) {
                console.log(buffer.slice(0, idx));
                buffer = buffer.slice(idx);
              }
              return 1;
            case 6: // Time
              return 1;
            default:
              return 0; // False, unimplemented
          }
        }
      }
    }
  );

  try {
    instance.exports.doit();
  } catch{}
  const r = repl.start("node> ");
  r.context.i = instance;
}

init();
