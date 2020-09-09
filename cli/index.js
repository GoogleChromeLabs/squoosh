const mozjpeg_dec = require("../codecs/mozjpeg/dec/mozjpeg_dec.js");
const mozjpeg_enc = require("../codecs/mozjpeg/enc/mozjpeg_enc.js");
const webp_enc = require("../codecs/webp/enc/webp_enc.js");
const visdifModule = require("../codecs/visdif/visdif.js");

// Our decoders currently rely on this.
globalThis.ImageData = require("./image_data.js");

const fsp = require("fs").promises;

async function decodeFile(file) {
  const buffer = await fsp.readFile(file);
  const rgba = (await mozjpeg_dec()).decode(new Uint8Array(buffer));
  return rgba;
}

const butteraugliGoal = 1.4;
const maxRounds = 8;
async function optimize(bitmapIn, encode, decode) {
  let quality = 50;
  let inc = 25;
  let butteraugliDistance = 2;
  let attempts = 0;
  let bitmapOut;
  let binaryOut;

  const { VisDiff } = await visdifModule();
  const comparator = new VisDiff(
    bitmapIn.data,
    bitmapIn.width,
    bitmapIn.height
  );
  do {
    binaryOut = await encode(bitmapIn, quality);
    bitmapOut = await decode(binaryOut);
    butteraugliDistance = comparator.distance(bitmapOut.data);
    console.log({
      butteraugliDistance,
      quality,
      attempts,
      binaryOut,
      bitmapOut
    });
    if (butteraugliDistance > butteraugliGoal) {
      quality += inc;
    } else {
      quality -= inc;
    }
    inc /= 2;
    attempts++;
  } while (
    Math.abs(butteraugliDistance - butteraugliGoal) > 0.1 &&
    attempts < maxRounds
  );

  comparator.delete();

  return {
    bitmap: bitmapOut,
    binary: binaryOut,
    quality,
    attempts
  };
}

async function main() {
  const [, , inFile, outFile] = process.argv;
  const bitmapIn = await decodeFile(inFile);

  const jpegEncModule = await mozjpeg_enc();
  const jpegEnc = async (bitmap, quality) =>
    jpegEncModule.encode(bitmap.data.buffer, bitmap.width, bitmap.height, {
      quality,
      baseline: false,
      arithmetic: false,
      progressive: true,
      optimize_coding: true,
      smoothing: 0,
      color_space: 3 /*YCbCr*/,
      quant_table: 3,
      trellis_multipass: false,
      trellis_opt_zero: false,
      trellis_opt_table: false,
      trellis_loops: 1,
      auto_subsample: true,
      chroma_subsample: 2,
      separate_chroma_quality: false,
      chroma_quality: 75
    });
  const jpegDecModule = await mozjpeg_dec();
  const jpegDec = async binary => jpegDecModule.decode(binary);
  const jpegOut = await optimize(bitmapIn, jpegEnc, jpegDec);
  await fsp.writeFile("out.jpg", jpegOut.binary);
  //await webp_enc();
  //console.log(bitmapIn);
}

main().catch(err => {
  console.error("Something went wrong");
  console.error(err);
  process.exit(1);
});
