import { program } from "commander";
import JSON5 from "json5";
import { Worker, isMainThread, parentPort } from "worker_threads";
import { cpus } from "os";
import { extname, join, basename } from "path";
import { promises as fsp } from "fs";
import { version } from "json:../package.json";

import supportedFormats from "./codecs.js";

// Our decoders currently rely on a `ImageData` global.
import ImageData from "./image_data.js";
globalThis.ImageData = ImageData;

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

function uuid() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16)
  ).join("");
}

// Adds a unique ID to the message payload and waits
// for the worker to respond with that id as a signal
// that the job is done.
function jobPromise(worker, msg) {
  return new Promise(resolve => {
    const id = uuid();
    worker.postMessage(Object.assign(msg, { id }));
    worker.on("message", function f(msg) {
      if (msg.id !== id) {
        return;
      }
      worker.off("message", f);
      resolve(msg);
    });
  });
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

async function processFiles(files) {
  // Create output directory
  await fsp.mkdir(program.outputDir, { recursive: true });
  const pool = Array.from(
    { length: cpus().length },
    () => new Worker(process.argv[1])
  );
  let i = 0;
  const jobs = [];
  for (const file of files) {
    const ext = extname(file);
    const base = basename(file, ext);
    const bitmap = await decodeFile(file);

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
      jobs.push(
        jobPromise(pool[i], {
          bitmap,
          outputFile,
          encName,
          encConfig
        })
      );
      i = (i + 1) % pool.length;
    }
  }
  // Wait for all jobs to finish
  await Promise.allSettled(jobs);
  pool.forEach(worker => worker.terminate());
}

if (isMainThread) {
  program
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
  parentPort.on(
    "message",
    async ({ id, bitmap, outputFile, encName, encConfig, done }) => {
      const encoder = await supportedFormats[encName].enc();
      const out = encoder.encode(
        bitmap.data.buffer,
        bitmap.width,
        bitmap.height,
        encConfig
      );
      await fsp.writeFile(outputFile, out);
      // Signal we are done with this job
      parentPort.postMessage({ id });
    }
  );
}
