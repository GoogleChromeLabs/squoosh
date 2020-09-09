const { program } = require("commander");
const JSON5 = require("json5");
//const { Worker, isMainThread, parentPort } = require('worker_threads');
//const {cpus} = require("os");
const path = require("path");
const fsp = require("fs").promises;

const visdifModule = require("../codecs/visdif/visdif.js");

// Our decoders currently rely on this.
globalThis.ImageData = require("./image_data.js");

const supportedFormats = {
  mozjpeg: {
    name: "MozJPEG",
    extension: "jpg",
    detectors: [/^\xFF\xD8\xFF/],
    dec: require("../codecs/mozjpeg/dec/mozjpeg_dec.js"),
    enc: require("../codecs/mozjpeg/enc/mozjpeg_enc.js"),
    defaultEncoderOptions: {
      quality: 75,
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
    }
  },
  webp: {
    name: "WebP",
    extension: "webp",
    detectors: [/^RIFF....WEBPVP8[LX ]/],
    dec: require("../codecs/webp/dec/webp_dec.js"),
    enc: require("../codecs/webp/enc/webp_enc.js"),
    defaultEncoderOptions: {
      quality: 75,
      target_size: 0,
      target_PSNR: 0,
      method: 4,
      sns_strength: 50,
      filter_strength: 60,
      filter_sharpness: 0,
      filter_type: 1,
      partitions: 0,
      segments: 4,
      pass: 1,
      show_compressed: 0,
      preprocessing: 0,
      autofilter: 0,
      partition_limit: 0,
      alpha_compression: 1,
      alpha_filtering: 1,
      alpha_quality: 100,
      lossless: 0,
      exact: 0,
      image_hint: 0,
      emulate_jpeg_size: 0,
      thread_level: 0,
      low_memory: 0,
      near_lossless: 100,
      use_delta_palette: 0,
      use_sharp_yuv: 0
    }
  },
  avif: {
    name: "AVIF",
    extension: "avif",
    detectors: [/^\x00\x00\x00 ftypavif\x00\x00\x00\x00/],
    dec: require("../codecs/avif/dec/avif_dec.js"),
    enc: require("../codecs/avif/enc/avif_enc.js"),
    defaultEncoderOptions: {
      minQuantizer: 16,
      maxQuantizer: 16,
      tileColsLog2: 0,
      tileRowsLog2: 0,
      speed: 10,
      subsample: 0
    }
  }
};
async function decodeFile(file) {
  const buffer = await fsp.readFile(file);
  const firstChunk = buffer.slice(0, 16);
  const firstChunkString = Array.from(firstChunk)
    .map(v => String.fromCodePoint(v))
    .join("");
  const key = Object.entries(supportedFormats).find(([name, { detectors }]) =>
    detectors.some(detector => detector.exec(firstChunkString))
  )?.[0];
  if (!key) {
    throw Error(`${file} has an unsupported format`);
  }
  const rgba = (await supportedFormats[key].dec()).decode(
    new Uint8Array(buffer)
  );
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

//if(isMainThread) {
program
  .version(require("./package.json").version)
  .arguments("<files...>")
  .option("-d, --output-dir <dir>", "Output directory", ".");

// Create a CLI option for each supported encoder
for (const [key, value] of Object.entries(supportedFormats)) {
  program.option(
    `--${key} [config]`,
    `Use ${value.name} to generate a .${value.extension} file with the given configuration`
  );
}

program.action(async files => {
  // Create output directory
  await fsp.mkdir(program.outputDir, { recursive: true });
  //const pool = Array.from({length: cpus().length}, () => new Worker(process.argv[1]));
  let i = 0;
  for (const file of files) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const bitmapIn = await decodeFile(file);

    for (const [key, value] of Object.entries(supportedFormats)) {
      if (!program[key]) {
        continue;
      }
      const encConfig = Object.assign(
        {},
        value.defaultEncoderOptions,
        JSON5.parse(program[key])
      );
      const encoder = await value.enc();
      const out = encoder.encode(
        bitmapIn.data.buffer,
        bitmapIn.width,
        bitmapIn.height,
        encConfig
      );
      const outputFile = path.join(
        program.outputDir,
        `${base}.${value.extension}`
      );
      await fsp.writeFile(outputFile, out);
    }
    // pool[i].postMessage({
    // 	inFile: file,
    // 	outFile: path.join(program.outputDir, base,kkkkk
    // })
  }
});

program.parse(process.argv);
//} else {
//	parentPort.on("message", async ({inFile, outFile, encoder, config}) => {
//	});
//}
