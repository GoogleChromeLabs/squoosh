// THIS IS NOT A NODE SCRIPT
// This is a d8 script. Please install jsvu[1] and install v8.
// Then run `npm run --silent benchmark`.
// [1]: https://github.com/GoogleChromeLabs/jsvu
async function init() {
  //  Adjustable constants.
  const imageDimensions = 4096;
  const iterations = new Array(100);

  // Constants. Don’t change.
  const imageByteSize = imageDimensions * imageDimensions * 4;
  const wasmPageSize = 64 * 1024;

  const buffer = readbuffer("rotate.wasm");
  const { instance } = await WebAssembly.instantiate(buffer);

  const pagesAvailable = Math.floor(
    instance.exports.memory.buffer.byteLength / wasmPageSize
  );
  const pagesNeeded = Math.floor((imageByteSize * 2 + 4) / wasmPageSize) + 1;
  const additionalPagesNeeded = pagesNeeded - pagesAvailable;
  if (additionalPagesNeeded > 0) {
    instance.exports.memory.grow(additionalPagesNeeded);
  }

  [0, 90, 180, 270].forEach(rotation => {
    print(`\n${rotation} degrees`);
    print(`==============================`);
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      instance.exports.rotate(imageDimensions, imageDimensions, rotation);
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
init().catch(e => console.error(e.stack));
