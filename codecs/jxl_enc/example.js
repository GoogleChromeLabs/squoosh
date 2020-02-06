const fs = require("fs");
const avifEnc = require("./jxl_enc.js")(fs.readFileSync("./jxl_enc.wasm"));

avifEnc.onRuntimeInitialized = () => {
  const jxl = avifEnc.encode(
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
    3,
    1
  );
  console.log(jxl)
  fs.writeFileSync("lol.jxl", jxl);
};
