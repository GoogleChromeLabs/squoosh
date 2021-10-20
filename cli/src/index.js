#!/usr/bin/env node

import { program } from 'commander/esm.mjs';
import JSON5 from 'json5';
import path from 'path';
import { promises as fsp } from 'fs';
import { cpus } from 'os';
import ora from 'ora';
import kleur from 'kleur';

import { ImagePool, preprocessors, encoders } from '@squoosh/lib';

const spinner = ora();

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

const suffix = ['B', 'KB', 'MB'];
function prettyPrintSize(size) {
  const base = Math.floor(Math.log2(size) / 10);
  const index = clamp(base, 0, 2);
  return (size / 2 ** (10 * index)).toFixed(2) + suffix[index];
}

function progressTracker(fileResults) {
  const tracker = {};
  tracker.spinner = spinner;
  tracker.progressOffset = 0;
  tracker.total = 0;
  let status = '';
  tracker.setStatus = (text) => {
    status = text || '';
    update();
  };
  let progress = '';
  tracker.setProgress = (done) => {
    const progressWithOffset = tracker.progressOffset + done;
    spinner.text = kleur.dim(`${progressWithOffset}/${tracker.total}`);
    const completeness = progressWithOffset / tracker.total;
    progress = kleur.cyan(
      `▐${'▨'.repeat((completeness * 10) | 0).padEnd(10, '╌')}▌ `,
    );
    update();
  };
  function update() {
    spinner.prefixText =
      getResultsText() + '\n' + progress + kleur.bold(status);
  }
  tracker.finish = (text) => {
    update();
    spinner.succeed(kleur.bold(text));
  };
  function getResultsText() {
    let out = '';
    for (const result of fileResults) {
      out += `\n ${kleur.cyan(result.file)}: ${prettyPrintSize(result.size)}`;
      for (const { outputFile, outputSize, infoText } of result.outputs) {
        out += `\n  ${kleur.dim('└')} ${kleur.cyan(
          outputFile.padEnd(5),
        )} → ${prettyPrintSize(outputSize)}`;
        const percent = ((outputSize / result.size) * 100).toPrecision(3);
        out += ` (${kleur[outputSize > result.size ? 'red' : 'green'](
          percent + '%',
        )})`;
        if (infoText) out += kleur.yellow(infoText);
      }
    }
    return out || '\n';
  }
  spinner.start();
  return tracker;
}

async function getInputFiles(paths) {
  const validFiles = [];

  for (const inputPath of paths) {
    const files = (await fsp.lstat(inputPath)).isDirectory()
      ? (await fsp.readdir(inputPath, { withFileTypes: true }))
          .filter((dirent) => dirent.isFile())
          .map((dirent) => path.join(inputPath, dirent.name))
      : [inputPath];
    for (const file of files) {
      try {
        await fsp.stat(file);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(
            `Warning: Input file does not exist: ${path.resolve(file)}`,
          );
          continue;
        } else {
          throw err;
        }
      }

      validFiles.push(file);
    }
  }

  return validFiles;
}

async function decodeImages(imagePool, results, files) {
  return Promise.all(
    files.map(async (file) => {
      const buffer = await fsp.readFile(file);
      const image = imagePool.ingestImage(buffer);
      await image.decoded;
      results.set(image, {
        file,
        size: (await image.decoded).size,
        outputs: [],
      });
      return image;
    }),
  );
}

async function encodeImages(decodedFiles, results, progress) {
  let jobs = [];
  let jobsFinished = 0;
  for (const image of decodedFiles) {
    const originalFile = results.get(image).file;

    const encodeOptions = {
      optimizerButteraugliTarget: Number(
        program.opts().optimizerButteraugliTarget,
      ),
      maxOptimizerRounds: Number(program.opts().maxOptimizerRounds),
    };
    for (const encName of Object.keys(encoders)) {
      const encParam = program.opts()[encName];
      if (!encParam) {
        continue;
      }
      if (!(typeof encParam === 'string')) {
        throw new Error(
          `Invalid argument specified for "${encName}". Missing encoding configuration.`,
        );
      }
      const encConfig =
        encParam.toLowerCase() === 'auto' ? 'auto' : JSON5.parse(encParam);
      encodeOptions[encName] = encConfig;
    }
    const job = image.encode(encodeOptions).then(async () => {
      jobsFinished++;
      const outputPath = path.join(
        program.opts().outputDir,
        path.basename(originalFile, path.extname(originalFile)) +
          program.opts().suffix,
      );
      for (const output of Object.values(image.encodedWith)) {
        const outputFile = `${outputPath}.${(await output).extension}`;
        await fsp.writeFile(outputFile, (await output).binary);
        results
          .get(image)
          .outputs.push(Object.assign(await output, { outputFile }));
      }
      progress.setProgress(jobsFinished);
    });
    jobs.push(job);
  }
  await Promise.all(jobs);
}

async function processFiles(files) {
  files = await getInputFiles(files);

  const parallelExecutionLimit = cpus().length;
  const imagePool = new ImagePool(parallelExecutionLimit);

  // Create output directory
  await fsp.mkdir(program.opts().outputDir, { recursive: true });

  const preprocessOptions = {};

  for (const preprocessorName of Object.keys(preprocessors)) {
    if (!program.opts()[preprocessorName]) {
      continue;
    }
    preprocessOptions[preprocessorName] = JSON5.parse(
      program.opts()[preprocessorName],
    );
  }

  const fileResults = [];
  const progress = progressTracker(fileResults);
  progress.total = files.length;

  for (
    let fileLimit = 0;
    fileLimit < files.length;
    fileLimit += parallelExecutionLimit
  ) {
    // Make sure to only use the results in this for-loop. Otherwise, we keep hold of the memory across jobs, leading to OOMs.
    const results = new Map();

    const fromIndex = fileLimit;
    const toIndex = Math.min(fileLimit + parallelExecutionLimit, files.length);

    progress.setStatus('Decoding...');
    progress.progressOffset = fromIndex;
    progress.setProgress(0);

    const decodedFiles = await decodeImages(
      imagePool,
      results,
      files.slice(fromIndex, toIndex),
    );

    for (const image of decodedFiles) {
      image.preprocess(preprocessOptions);
    }

    await Promise.all(decodedFiles.map((image) => image.decoded));

    progress.setStatus(
      'Encoding ' + kleur.dim(`(${imagePool.workerPool.numWorkers} threads)`),
    );

    await encodeImages(decodedFiles, results, progress);

    for (const result of results.values()) {
      fileResults.push({
        file: result.file,
        size: result.size,
        outputs: result.outputs.map(
          ({ outputFile, size: outputSize, infoText }) => {
            return {
              outputSize,
              outputFile,
              infoText,
            };
          },
        ),
      });
    }
  }

  await imagePool.close();

  progress.finish(`Successfully compressed all ${files.length} images`);
}

program
  .name('squoosh-cli')
  .arguments('<files...>')
  .option('-d, --output-dir <dir>', 'Output directory', '.')
  .option('-s, --suffix <suffix>', 'Append suffix to output files', '')
  .option(
    '--max-optimizer-rounds <rounds>',
    'Maximum number of compressions to use for auto optimizations',
    '6',
  )
  .option(
    '--optimizer-butteraugli-target <butteraugli distance>',
    'Target Butteraugli distance for auto optimizer',
    '1.4',
  )
  .action(processFiles);

// Create a CLI option for each supported preprocessor
for (const [key, value] of Object.entries(preprocessors)) {
  program.option(`--${key} [config]`, value.description);
}
// Create a CLI option for each supported encoder
for (const [key, value] of Object.entries(encoders)) {
  program.option(
    `--${key} [config]`,
    `Use ${value.name} to generate a .${value.extension} file with the given configuration`,
  );
}

await program.parseAsync(process.argv);
