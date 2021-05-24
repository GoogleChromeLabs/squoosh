#!/usr/bin/env node

import { program } from 'commander/esm.mjs';
import JSON5 from 'json5';
import path from 'path';
import { promises as fsp } from 'fs';
import ora from 'ora';
import kleur from 'kleur';

import { ImagePool, preprocessors, encoders } from '@squoosh/lib';

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

function progressTracker(results) {
  const spinner = ora();
  const tracker = {};
  tracker.spinner = spinner;
  tracker.progressOffset = 0;
  tracker.totalOffset = 0;
  let status = '';
  tracker.setStatus = (text) => {
    status = text || '';
    update();
  };
  let progress = '';
  tracker.setProgress = (done, total) => {
    spinner.prefixText = kleur.dim(`${done}/${total}`);
    const completeness =
      (tracker.progressOffset + done) / (tracker.totalOffset + total);
    progress = kleur.cyan(
      `▐${'▨'.repeat((completeness * 10) | 0).padEnd(10, '╌')}▌ `,
    );
    update();
  };
  function update() {
    spinner.text = progress + kleur.bold(status) + getResultsText();
  }
  tracker.finish = (text) => {
    spinner.succeed(kleur.bold(text) + getResultsText());
  };
  function getResultsText() {
    let out = '';
    for (const result of results.values()) {
      out += `\n ${kleur.cyan(result.file)}: ${prettyPrintSize(result.size)}`;
      for (const { outputFile, size: outputSize, infoText } of result.outputs) {
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
      ? (await fsp.readdir(inputPath, {withFileTypes: true})).filter(dirent => dirent.isFile()).map(dirent => path.join(inputPath, dirent.name))
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

async function processFiles(files) {
  files = await getInputFiles(files);

  const imagePool = new ImagePool();

  const results = new Map();
  const progress = progressTracker(results);

  progress.setStatus('Decoding...');
  progress.totalOffset = files.length;
  progress.setProgress(0, files.length);

  // Create output directory
  await fsp.mkdir(program.opts().outputDir, { recursive: true });

  let decoded = 0;
  let decodedFiles = await Promise.all(
    files.map(async (file) => {
      const image = imagePool.ingestImage(file);
      await image.decoded;
      results.set(image, {
        file,
        size: (await image.decoded).size,
        outputs: [],
      });
      progress.setProgress(++decoded, files.length);
      return image;
    }),
  );

  const preprocessOptions = {};

  for (const preprocessorName of Object.keys(preprocessors)) {
    if (!program.opts()[preprocessorName]) {
      continue;
    }
    preprocessOptions[preprocessorName] = JSON5.parse(
      program.opts()[preprocessorName],
    );
  }

  for (const image of decodedFiles) {
    image.preprocess(preprocessOptions);
  }

  await Promise.all(decodedFiles.map((image) => image.decoded));

  progress.progressOffset = decoded;
  progress.setStatus(
    'Encoding ' + kleur.dim(`(${imagePool.workerPool.numWorkers} threads)`),
  );
  progress.setProgress(0, files.length);

  const jobs = [];
  let jobsStarted = 0;
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
      if (!program.opts()[encName]) {
        continue;
      }
      const encParam = program.opts()[encName];
      const encConfig =
        encParam.toLowerCase() === 'auto' ? 'auto' : JSON5.parse(encParam);
      encodeOptions[encName] = encConfig;
    }
    jobsStarted++;
    const job = image.encode(encodeOptions).then(async () => {
      jobsFinished++;
      const outputPath = path.join(
        program.opts().outputDir,
        program.opts().suffix +
          path.basename(originalFile, path.extname(originalFile)),
      );
      for (const output of Object.values(image.encodedWith)) {
        const outputFile = `${outputPath}.${(await output).extension}`;
        await fsp.writeFile(outputFile, (await output).binary);
        results
          .get(image)
          .outputs.push(Object.assign(await output, { outputFile }));
      }
      progress.setProgress(jobsFinished, jobsStarted);
    });
    jobs.push(job);
  }

  // update the progress to account for multi-format
  progress.setProgress(jobsFinished, jobsStarted);
  // Wait for all jobs to finish
  await Promise.all(jobs);
  await imagePool.close();
  progress.finish('Squoosh results:');
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

program.parse(process.argv);
