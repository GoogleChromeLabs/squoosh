import { program } from "commander";
import JSON5 from "json5";
import { isMainThread } from "worker_threads";
import { cpus } from "os";
import { extname, join, basename } from "path";
import { promises as fsp } from "fs";
import { version } from "json:../package.json";
import ora from "ora";
import kleur from "kleur";

import { codecs as supportedFormats, preprocessors } from "./codecs.js";
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

async function preprocessImage({ preprocessorName, options, file }) {
  const preprocessor = await preprocessors[preprocessorName].instantiate();
  file.bitmap = await preprocessor(
    file.bitmap.data,
    file.bitmap.width,
    file.bitmap.height,
    options
  );
  return file;
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
  let out, infoText;
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
        butteraugliDistanceGoal: optimizerButteraugliTarget,
        maxRounds: maxOptimizerRounds
      }
    );
    out = binary;
    const opts = {
      // 5 significant digits is enough
      [optionToOptimize]: Math.round(quality * 10000) / 10000
    };
    infoText = ` using --${encName} '${JSON5.stringify(opts)}'`;
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
    infoText,
    inputSize: size,
    inputFile: file,
    outputFile,
    outputSize: out.length
  };
}

// both decoding and encoding go through the worker pool
function handleJob(params) {
  const { operation } = params;
  switch (operation) {
    case "encode":
      return encodeFile(params);
    case "decode":
      return decodeFile(params.file);
    case "preprocess":
      return preprocessImage(params);
    default:
      throw Error(`Invalid job "${operation}"`);
  }
}

function progressTracker(results) {
  const spinner = ora();
  const tracker = {};
  tracker.spinner = spinner;
  tracker.progressOffset = 0;
  tracker.totalOffset = 0;
  let status = "";
  tracker.setStatus = text => {
    status = text || "";
    update();
  };
  let progress = "";
  tracker.setProgress = (done, total) => {
    spinner.prefixText = kleur.dim(`${done}/${total}`);
    const completeness =
      (tracker.progressOffset + done) / (tracker.totalOffset + total);
    progress = kleur.cyan(
      `▐${"▨".repeat((completeness * 10) | 0).padEnd(10, "╌")}▌ `
    );
    update();
  };
  function update() {
    spinner.text = progress + kleur.bold(status) + getResultsText();
  }
  tracker.finish = text => {
    spinner.succeed(kleur.bold(text) + getResultsText());
  };
  function getResultsText() {
    let out = "";
    for (const [filename, result] of results.entries()) {
      out += `\n ${kleur.cyan(filename)}: ${prettyPrintSize(result.size)}`;
      for (const { outputFile, outputSize, infoText } of result.outputs) {
        const name = (program.suffix + extname(outputFile)).padEnd(5);
        out += `\n  ${kleur.dim("└")} ${kleur.cyan(name)} → ${prettyPrintSize(
          outputSize
        )}`;
        const percent = ((outputSize / result.size) * 100).toPrecision(3);
        out += ` (${kleur[outputSize > result.size ? "red" : "green"](
          percent + "%"
        )})`;
        if (infoText) out += kleur.yellow(infoText);
      }
    }
    return out || "\n";
  }
  spinner.start();
  return tracker;
}

async function processFiles(files) {
  const parallelism = cpus().length;

  const results = new Map();
  const progress = progressTracker(results);

  progress.setStatus("Decoding...");
  progress.totalOffset = files.length;
  progress.setProgress(0, files.length);

  const workerPool = new WorkerPool(parallelism, __filename);
  // Create output directory
  await fsp.mkdir(program.outputDir, { recursive: true });

  let decoded = 0;
  let decodedFiles = await Promise.all(
    files.map(async file => {
      const result = await workerPool.dispatchJob({
        operation: "decode",
        file
      });
      results.set(file, {
        file: result.file,
        size: result.size,
        outputs: []
      });
      progress.setProgress(++decoded, files.length);
      return result;
    })
  );

  for (const [preprocessorName, value] of Object.entries(preprocessors)) {
    if (!program[preprocessorName]) {
      continue;
    }
    const preprocessorParam = program[preprocessorName];
    const preprocessorOptions = Object.assign(
      {},
      value.defaultOptions,
      JSON5.parse(preprocessorParam)
    );

    decodedFiles = await Promise.all(
      decodedFiles.map(async file => {
        return workerPool.dispatchJob({
          file,
          operation: "preprocess",
          preprocessorName,
          options: preprocessorOptions
        });
      })
    );

    for (const { file, bitmap, size } of decodedFiles) {
    }
  }

  progress.progressOffset = decoded;
  progress.setStatus("Encoding " + kleur.dim(`(${parallelism} threads)`));
  progress.setProgress(0, files.length);

  const jobs = [];
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
      const p = workerPool
        .dispatchJob({
          operation: "encode",
          file,
          size,
          bitmap,
          outputFile,
          encName,
          encConfig,
          optimizerButteraugliTarget: Number(
            program.optimizerButteraugliTarget
          ),
          maxOptimizerRounds: Number(program.maxOptimizerRounds)
        })
        .then(output => {
          jobsFinished++;
          results.get(file).outputs.push(output);
          progress.setProgress(jobsFinished, jobsStarted);
        });
      jobs.push(p);
    }
  }

  // update the progress to account for multi-format
  progress.setProgress(jobsFinished, jobsStarted);
  // Wait for all jobs to finish
  await workerPool.join();
  await Promise.all(jobs);
  progress.finish("Squoosh results:");
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
      "6"
    )
    .option(
      "--optimizer-butteraugli-target <butteraugli distance>",
      "Target Butteraugli distance for auto optimizer",
      "1.4"
    )
    .action(processFiles);

  // Create a CLI option for each supported preprocessor
  for (const [key, value] of Object.entries(preprocessors)) {
    program.option(`--${key} [config]`, value.description);
  }
  // Create a CLI option for each supported encoder
  for (const [key, value] of Object.entries(supportedFormats)) {
    program.option(
      `--${key} [config]`,
      `Use ${value.name} to generate a .${value.extension} file with the given configuration`
    );
  }

  program.parse(process.argv);
} else {
  WorkerPool.useThisThreadAsWorker(handleJob);
}
