import { proxy } from 'comlink';

export class CancellationError extends Error {}

export abstract class CodecWorker<InputType, EncodeOptions, OutputType> {
  worker?: Worker;
  // cached instance of the comlink'd Encoder class
  codec?: any;
  // is the worker currently performing an encode?
  busy = false;
  // each encode increments this counter, used to determine if an encode result is outdated.
  jobIdCounter = 0;

  method: string = 'encode';

  protected load(): Worker {
    throw Error('Not Implemented');
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
    this.worker = this.codec = undefined;
  }

  protected preprocess(data: InputType, options?: EncodeOptions): any {
    return data;
  }

  async process(data: InputType, options?: EncodeOptions): Promise<OutputType> {
    // If there is a pending encode, terminate the worker and we'll create a new one.
    if (this.busy) {
      this.terminate();
    }

    this.busy = true;
    const id = this.jobIdCounter += 1;

    if (!this.worker) {
      this.worker = this.load();
      this.codec = proxy(this.worker) as any;
    }

    try {
      const [encoder, preprocessed] = await Promise.all([
        new this.codec(),
        this.preprocess(data),
      ]);

      if (id !== this.jobIdCounter) throw 0;

      return await encoder[this.method](preprocessed, options);
    } finally {
      // If we got an encode result back but there's a newer pending encode, discard the result.
      if (id !== this.jobIdCounter) throw new CancellationError('Cancelled');

      // we're the most recent encode job and we just completed, so mark the worker as free.
      this.busy = false;
    }
  }
}

export class EncoderWorker<InputType, EncodeOptions>
extends CodecWorker<InputType, EncodeOptions, ArrayBuffer> {
  method = 'encode';

  async encode(data: InputType, options?: EncodeOptions): Promise<ArrayBuffer> {
    return this.process(data, options);
  }
}

export class DecoderWorker<InputType, DecodeOptions>
extends CodecWorker<InputType, DecodeOptions, ImageData> {
  method = 'decode';

  async decode(data: InputType, options?: DecodeOptions): Promise<ImageData> {
    return this.process(data, options);
  }
}
