const fs = require("fs");
const avifEnc = require("./avif_enc.js")(fs.readFileSync("./avif_enc.wasm"));

avifEnc.onRuntimeInitialized = () => {
  const avif = avifEnc.encode(
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
    3,
    1
  );
  fs.writeFileSync("lol.avif", avif);
};
