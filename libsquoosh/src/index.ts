import { isMainThread } from 'worker_threads';
import { promises as fsp } from 'fs';

import { codecs as encoders, preprocessors } from './codecs.js';
import WorkerPool from './worker_pool.js';
import { autoOptimize } from './auto-optimizer.js';
import type ImageData from './image_data';

export { ImagePool, encoders, preprocessors };
type EncoderKey = keyof typeof encoders;
type PreprocessorKey = keyof typeof preprocessors;
type FileLike = Buffer | ArrayBuffer | string | ArrayBufferView;

async function decodeFile({
  file,
}: {
  file: FileLike;
}): Promise<{ bitmap: ImageData; size: number }> {
  let buffer;
  if (ArrayBuffer.isView(file)) {
    buffer = Buffer.from(file.buffer);
    file = 'Binary blob';
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
    file = 'Binary blob';
  } else if ((file as unknown) instanceof Buffer) {
    // TODO: Check why we need type assertions here.
    buffer = (file as unknown) as Buffer;
    file = 'Binary blob';
  } else if (typeof file === 'string') {
    buffer = await fsp.readFile(file);
  } else {
    throw Error('Unexpected input type');
  }
  const firstChunk = buffer.slice(0, 16);
  const firstChunkString = Array.from(firstChunk)
    .map((v) => String.fromCodePoint(v))
    .join('');
  const key = Object.entries(encoders).find(([_name, { detectors }]) =>
    detectors.some((detector) => detector.exec(firstChunkString)),
  )?.[0] as EncoderKey | undefined;
  if (!key) {
    throw Error(`${file} has an unsupported format`);
  }
  const encoder = encoders[key];
  const mod = await encoder.dec();
  const rgba = mod.decode(new Uint8Array(buffer));
  return {
    bitmap: rgba,
    size: buffer.length,
  };
}

async function preprocessImage({
  preprocessorName,
  options,
  image,
}: {
  preprocessorName: PreprocessorKey;
  options: any;
  image: { bitmap: ImageData };
}) {
  const preprocessor = await preprocessors[preprocessorName].instantiate();
  image.bitmap = await preprocessor(
    Uint8Array.from(image.bitmap.data),
    image.bitmap.width,
    image.bitmap.height,
    options,
  );
  return image;
}

async function encodeImage({
  bitmap: bitmapIn,
  encName,
  encConfig,
  optimizerButteraugliTarget,
  maxOptimizerRounds,
}: {
  bitmap: ImageData;
  encName: EncoderKey;
  encConfig: any;
  optimizerButteraugliTarget: number;
  maxOptimizerRounds: number;
}) {
  let binary: Uint8Array;
  let optionsUsed = encConfig;
  const encoder = await encoders[encName].enc();
  if (encConfig === 'auto') {
    const optionToOptimize = encoders[encName].autoOptimize.option;
    const decoder = await encoders[encName].dec();
    const encode = (bitmapIn: ImageData, quality: number) =>
      encoder.encode(
        bitmapIn.data,
        bitmapIn.width,
        bitmapIn.height,
        Object.assign({}, encoders[encName].defaultEncoderOptions as any, {
          [optionToOptimize]: quality,
        }),
      );
    const decode = (binary: Uint8Array) => decoder.decode(binary);
    const nonNullEncode = (bitmap: ImageData, quality: number): Uint8Array => {
      const result = encode(bitmap, quality);
      if (!result) {
        throw new Error('There was an error while encoding');
      }
      return result;
    };
    const { binary: optimizedBinary, quality } = await autoOptimize(
      bitmapIn,
      nonNullEncode,
      decode,
      {
        min: encoders[encName].autoOptimize.min,
        max: encoders[encName].autoOptimize.max,
        butteraugliDistanceGoal: optimizerButteraugliTarget,
        maxRounds: maxOptimizerRounds,
      },
    );
    binary = optimizedBinary;
    optionsUsed = {
      // 5 significant digits is enough
      [optionToOptimize]: Math.round(quality * 10000) / 10000,
    };
  } else {
    const result = encoder.encode(
      bitmapIn.data.buffer,
      bitmapIn.width,
      bitmapIn.height,
      encConfig,
    );

    if (!result) {
      throw new Error('There was an error while encoding');
    }

    binary = result;
  }
  return {
    optionsUsed,
    binary,
    extension: encoders[encName].extension,
    size: binary.length,
  };
}

type EncodeParams = { operation: 'encode' } & Parameters<typeof encodeImage>[0];
type DecodeParams = { operation: 'decode' } & Parameters<typeof decodeFile>[0];
type PreprocessParams = { operation: 'preprocess' } & Parameters<
  typeof preprocessImage
>[0];
type JobMessage = EncodeParams | DecodeParams | PreprocessParams;

function handleJob(params: JobMessage) {
  switch (params.operation) {
    case 'encode':
      return encodeImage(params);
    case 'decode':
      return decodeFile(params);
    case 'preprocess':
      return preprocessImage(params);
    default:
      throw Error(`Invalid job "${(params as any).operation}"`);
  }
}

/**
 * Represents an ingested image.
 */
class Image {
  public file: ArrayBuffer;
  public workerPool: WorkerPool<JobMessage, any>;
  public decoded: Promise<{ bitmap: ImageData }>;
  public encodedWith: { [key: string]: any };

  constructor(workerPool: WorkerPool<JobMessage, any>, file: ArrayBuffer) {
    this.file = file;
    this.workerPool = workerPool;
    this.decoded = workerPool.dispatchJob({ operation: 'decode', file });
    this.encodedWith = {};
  }

  /**
   * Define one or several preprocessors to use on the image.
   * @param {object} preprocessOptions - An object with preprocessors to use, and their settings.
   * @returns {Promise<undefined>} - A promise that resolves when all preprocessors have completed their work.
   */
  async preprocess(preprocessOptions = {}) {
    for (const [name, options] of Object.entries(preprocessOptions)) {
      if (!Object.keys(preprocessors).includes(name)) {
        throw Error(`Invalid preprocessor "${name}"`);
      }
      const preprocessorName = name as PreprocessorKey;
      const preprocessorOptions = Object.assign(
        {},
        preprocessors[preprocessorName].defaultOptions,
        options,
      );
      this.decoded = this.workerPool.dispatchJob({
        operation: 'preprocess',
        preprocessorName,
        image: await this.decoded,
        options: preprocessorOptions,
      });
      await this.decoded;
    }
  }

  /**
   * Define one or several encoders to use on the image.
   * @param {object} encodeOptions - An object with encoders to use, and their settings.
   * @returns {Promise<void>} - A promise that resolves when the image has been encoded with all the specified encoders.
   */
  async encode(
    encodeOptions: {
      optimizerButteraugliTarget?: number;
      maxOptimizerRounds?: number;
    } & {
      [key in EncoderKey]?: any; // any is okay for now
    } = {},
  ): Promise<void> {
    const { bitmap } = await this.decoded;
    for (const [name, options] of Object.entries(encodeOptions)) {
      if (!Object.keys(encoders).includes(name)) {
        continue;
      }
      const encName = name as EncoderKey;
      const encRef = encoders[encName];
      const encConfig =
        typeof options === 'string'
          ? options
          : Object.assign({}, encRef.defaultEncoderOptions, options);
      this.encodedWith[encName] = this.workerPool.dispatchJob({
        operation: 'encode',
        bitmap,
        encName,
        encConfig,
        optimizerButteraugliTarget: Number(
          encodeOptions.optimizerButteraugliTarget ?? 1.4,
        ),
        maxOptimizerRounds: Number(encodeOptions.maxOptimizerRounds ?? 6),
      });
    }
    await Promise.all(Object.values(this.encodedWith));
  }
}

/**
 * A pool where images can be ingested and squooshed.
 */
class ImagePool {
  public workerPool: WorkerPool<JobMessage, any>;
  public loadFile: (path: URL) => Promise<ArrayBuffer>;

  /**
   * Create a new pool.
   * @param {(path: URL) => Promise<ArrayBuffer>} [loadFile] - A function that loads a file from a URL.
   * @param {number} [threads] - Number of concurrent image processes to run in the pool.
   */
  constructor(loadFile: (path: URL) => Promise<ArrayBuffer>, threads: number) {
    this.loadFile = loadFile;
    this.workerPool = new WorkerPool(threads, __filename);
  }

  /**
   * Ingest an image into the image pool.
   * @param {URL} url - The URL path to the image that should be ingested and decoded.
   * @returns {Image} - A custom class reference to the decoded image.
   */
  ingestImage(url: URL): Image {
    const file = await this.loadFile(url);
    return new Image(this.workerPool, file);
  }

  /**
   * Closes the underlying image processing pipeline. The already processed images will still be there, but no new processing can start.
   * @returns {Promise<void>} - A promise that resolves when the underlying pipeline has closed.
   */
  async close(): Promise<void> {
    await this.workerPool.join();
  }
}

if (!isMainThread) {
  WorkerPool.useThisThreadAsWorker(handleJob);
}
