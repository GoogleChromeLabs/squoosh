import { program } from "commander";
import JSON5 from "json5";
import { isMainThread } from "worker_threads";
import { cpus } from "os";
import { extname, join, basename } from "path";
import { promises as fsp } from "fs";
import { version } from "json:../package.json";

import supportedFormats from "./codecs.js";
import WorkerPool from "./worker_pool.js";
import { autoOptimize } from "./auto-optimizer.js";

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
  bitmap: bitmapIn,
  outputFile,
  encName,
  encConfig,
  optimizerButteraugliTarget,
  maxOptimizerRounds
}) {
  let out;
  const encoder = await supportedFormats[encName].enc();
  if (encConfig === "auto") {
    const optionToOptimize = supportedFormats[encName].autoOptimize.option;
    const decoder = await supportedFormats[encName].dec();
    const encode = (bitmapIn, quality) =>
      encoder.encode(
        bitmapIn.data,
        bitmapIn.width,
        bitmapIn.height,
        Object.assign({}, supportedFormats[encName].defaultEncoderOptions, {
          [optionToOptimize]: quality
        })
      );
    const decode = binary => decoder.decode(binary);
    const { bitmap, binary, quality } = await autoOptimize(
      bitmapIn,
      encode,
      decode,
      {
        min: supportedFormats[encName].autoOptimize.min,
        max: supportedFormats[encName].autoOptimize.max,
        butteraugliDistanceTarget: optimizerButteraugliTarget,
        maxRounds: maxOptimizerRounds
      }
    );
    out = binary;
    console.log(
      `Used \`--${encName} '${JSON.stringify({
        [optionToOptimize]: quality
      })}'\` for ${outputFile}`
    );
  } else {
    out = encoder.encode(
      bitmapIn.data.buffer,
      bitmapIn.width,
      bitmapIn.height,
      encConfig
    );
  }
  await fsp.writeFile(outputFile, out);
  return {
    inputSize: size,
    inputFile: file,
    outputFile,
    outputSize: out.length
  };
}

async function processFiles(files) {
  const workerPool = new WorkerPool(cpus().length, __filename);
  // Create output directory
  await fsp.mkdir(program.outputDir, { recursive: true });

  const decodedFiles = await Promise.all(files.map(file => decodeFile(file)));

  let jobsStarted = 0;
  let jobsFinished = 0;
  for (const { file, bitmap, size } of decodedFiles) {
    const ext = extname(file);
    const base = basename(file, ext) + program.suffix;

    for (const [encName, value] of Object.entries(supportedFormats)) {
      if (!program[encName]) {
        continue;
      }
      const encParam =
        typeof program[encName] === "string" ? program[encName] : "{}";
      const encConfig =
        encParam.toLowerCase() === "auto"
          ? "auto"
          : Object.assign(
              {},
              value.defaultEncoderOptions,
              JSON5.parse(encParam)
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
          encConfig,
          optimizerButteraugliTarget: program.optimizerButteraugliTarget,
          maxOptimizerRounds: program.maxOptimizerRounds
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
    .option("-s, --suffix <suffix>", "Append suffix to output files", "")
    .option(
      "--max-optimizer-rounds <rounds>",
      "Maximum number of compressions to use for auto optimizations",
      6
    )
    .option(
      "--optimizer-butteraugli-target <butteraugli distance>",
      "Target Butteraugli distance for auto optimizer",
      1.4
    )
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
