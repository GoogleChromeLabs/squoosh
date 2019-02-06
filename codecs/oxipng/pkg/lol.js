const oxipng = require("./oxipng_wasm");
const repl = require("repl");
const fs = require("fs");

async function init() {
  // const img = fs.readFileSync("img.png")
  // const output = oxipng.compress(img, 0);
  // fs.writeFileSync("output.png", output);
  console.log(">>>", oxipng.doit());
  const r = repl.start("node> ");
  r.context.i = oxipng;
}

init();
