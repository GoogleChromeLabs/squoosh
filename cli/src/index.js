import { program } from "commander";
import JSON5 from "json5";
import { isMainThread } from "worker_threads";
import { cpus } from "os";
import { extname, join, basename } from "path";
import { promises as fsp } from "fs";
import { version } from "json:../package.json";

import supportedFormats from "./codecs.js";
import WorkerPool from "./worker_pool.js";

// Our decoders currently rely on a `ImageData` global.
import ImageData from "./image_data.js";
globalThis.ImageData = ImageData;

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

const suffix = ["B", "KB", "MB"];
function prettyPrintSize(size) {
  const base = Math.floor(Math.log2(size) / 10);
  const index = clamp(base, 0, 2);
  return (size / 2 ** (10 * index)).toFixed(2) + suffix[index];
}

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
  return {
    file,
    bitmap: rgba,
    size: buffer.length
  };
}

async function encodeFile({
  file,
  size,
  bitmap,
  outputFile,
  encName,
  encConfig
}) {
  const encoder = await supportedFormats[encName].enc();
  const out = encoder.encode(
    bitmap.data.buffer,
    bitmap.width,
    bitmap.height,
    encConfig
  );
  await fsp.writeFile(outputFile, out);
  return {
    inputSize: size,
    inputFile: file,
    outputFile,
    outputSize: out.length
  };
}

async function processFiles(files) {
  // Create output directory
  await fsp.mkdir(program.outputDir, { recursive: true });
  const workerPool = new WorkerPool(cpus().length, __filename);

  const decodedFiles = await Promise.all(files.map(file => decodeFile(file)));

  let jobsStarted = 0;
  let jobsFinished = 0;
  for (const { file, bitmap, size } of decodedFiles) {
    const ext = extname(file);
    const base = basename(file, ext);

    for (const [encName, value] of Object.entries(supportedFormats)) {
      if (!program[encName]) {
        continue;
      }
      const encConfig = Object.assign(
        {},
        value.defaultEncoderOptions,
        JSON5.parse(program[encName])
      );
      const outputFile = join(program.outputDir, `${base}.${value.extension}`);
      jobsStarted++;
      workerPool
        .dispatchJob({
          file,
          size,
          bitmap,
          outputFile,
          encName,
          encConfig
        })
        .then(({ outputFile, inputSize, outputSize }) => {
          jobsFinished++;
          const numDigits = jobsStarted.toString().length;
          console.log(
            `${jobsFinished
              .toString()
              .padStart(
                numDigits
              )}/${jobsStarted}: ${outputFile} ${prettyPrintSize(
              inputSize
            )} -> ${prettyPrintSize(outputSize)} (${(
              (outputSize / inputSize) *
              100
            ).toFixed(1)}%)`
          );
        });
    }
  }
  // Wait for all jobs to finish
  await workerPool.join();
}

if (isMainThread) {
  program
    .name("squoosh-cli")
    .version(version)
    .arguments("<files...>")
    .option("-d, --output-dir <dir>", "Output directory", ".")
    .action(processFiles);

  // Create a CLI option for each supported encoder
  for (const [key, value] of Object.entries(supportedFormats)) {
    program.option(
      `--${key} [config]`,
      `Use ${value.name} to generate a .${value.extension} file with the given configuration`
    );
  }

  program.parse(process.argv);
} else {
  WorkerPool.useThisThreadAsWorker(encodeFile);
}

/*
const butteraugliGoal = 1.4;
const maxRounds = 8;
async function optimize(bitmapIn, encode, decode) {
const visdifModule = require("../codecs/visdif/visdif.js");
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
}*/
