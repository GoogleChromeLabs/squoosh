// THIS IS NOT A NODE SCRIPT
// This is a d8 script. Please install jsvu[1] and install v8.
// Then run `npm run --silent benchmark`.
// [1]: https://github.com/GoogleChromeLabs/jsvu

async function init() {
  const start = Date.now();
  const module = await WebAssembly.compile(readbuffer("pkg/squooshhqx_bg.wasm"));
  print(`${Date.now()/1000 - start/1000}`);
}
init().catch(e => console.error(e.stack));