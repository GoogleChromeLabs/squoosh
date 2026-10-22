import type { JixelModule } from 'codecs/jixel/enc/jixel_enc';

interface Instance {
  module: Promise<JixelModule>;
  /** Rejects if the module aborts. */
  aborted: Promise<never>;
}

let instance: Instance | undefined;

function instantiate(): Instance {
  let rejectAborted!: (error: Error) => void;
  const aborted = new Promise<never>((_, reject) => {
    rejectAborted = reject;
  });
  // Only ever raced against a call, so don't report it as unhandled when no
  // call is in flight.
  aborted.catch(() => {});

  const module = (async () => {
    const { default: factory } = await import('codecs/jixel/enc/jixel_enc');
    return factory({
      noInitialRun: true,
      onAbort(what) {
        // A panic (most likely running out of memory) aborts the instance,
        // and the encode's promise would never settle. Fail it instead, and
        // start afresh next time.
        if (instance?.aborted === aborted) instance = undefined;
        rejectAborted(Error(`Jixel aborted: ${what || 'out of memory?'}`));
      },
    });
  })();

  return { module, aborted };
}

/**
 * Run `call` against the jixel wasm module, instantiated once per worker (or
 * again after an abort).
 *
 * This lives outside `worker/` because every file in there becomes its own
 * worker method, and both of this codec's methods (jixelEncode and
 * jixelTranscode) drive the same module.
 */
export async function withEncoder(
  call: (module: JixelModule) => Promise<Uint8Array | string>,
): Promise<ArrayBuffer> {
  if (!instance) instance = instantiate();
  const { module, aborted } = instance;
  const result = await Promise.race([module.then(call), aborted]);
  if (typeof result === 'string') throw Error(result);
  return result.buffer as ArrayBuffer;
}
