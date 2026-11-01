# Features

- **decoders** decode images the browser can't decode itself.
- **encoders** encode images.
- **processors** change images, generally in a way that potentially aids compression.
- **preprocessors** prepare the image for handling.

Each side of the editor processes and encodes on its own, whereas preprocessors
(rotation) apply to both sides.

## Files

Within a feature folder:

- `meta.ts` holds the options type and defaults (and, for encoders, `label`,
  `mimeType` and `extension`). Both the UI and the worker import it.
- `worker.ts` default-exports the function that runs in the web worker. It
  should import its codec with `await import()`, so the worker only loads the
  codecs it uses.
- `Options.vue` is the settings panel, bound with `v-model` to the options.
- `client.ts` holds any main-thread code (only resize has one).

## Adding an encoder

1. Add `meta.ts`, `worker.ts` and, if it has settings, `Options.vue`.
2. Expose the worker function in `src/worker/index.ts`, and add its name to
   `methodNames` in `src/worker/bridge.ts` (the build fails if you forget).
3. Add it to `encoderMap` in `registry.ts`, and its panel to
   `options-components.ts`. The `encoderMap` key is stored in saved side
   settings, so don't rename existing ones.
