// THIS IS NOT A NODE SCRIPT
// This is a d8 script. Please install jsvu[1] and install v8.
// Then run `npm run --silent benchmark`.
// [1]: https://github.com/GoogleChromeLabs/jsvu

self = global = this;
load('./pkg/resize.js');

async function init() {
  //  Adjustable constants.
  const inputDimensions = 2000;
  const outputDimensions = 1500;
  const algorithm = 3; // Lanczos
  const iterations = new Array(100);

  // Constants. Don’t change.
  const imageByteSize = inputDimensions * inputDimensions * 4;
  const imageBuffer = new Uint8ClampedArray(imageByteSize);

  const module = await WebAssembly.compile(readbuffer("./pkg/resize_bg.wasm"));
  await wasm_bindgen(module);
  [false, true].forEach(premulti => {
    print(`\npremultiplication: ${premulti}`);
    print(`==============================`);
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      wasm_bindgen.resize(imageBuffer, inputDimensions, inputDimensions, outputDimensions, outputDimensions, algorithm, premulti);
      iterations[i] = Date.now() - start;
    }
    const average = iterations.reduce((sum, c) => sum + c) / iterations.length;
    const stddev = Math.sqrt(
      iterations
        .map(i => Math.pow(i - average, 2))
        .reduce((sum, c) => sum + c) / iterations.length
    );
    print(`n = ${iterations.length}`);
    print(`Average: ${average}`);
    print(`StdDev: ${stddev}`);
  });
}
init().catch(e => console.error(e, e.stack));
