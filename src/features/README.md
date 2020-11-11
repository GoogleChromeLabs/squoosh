# Feature types

- **decoders** - decode images.
- **encoders** - encode images.
- **processors** - change images, generally in a way that potentially aids compression.
- **preprocessors** - prepares the image for handling.

The key difference between preprocessors and processors is each 'side' in Squoosh can process differently, whereas a preprocessor happens to both sides.

# Adding code to the worker

Any feature can have a `worker` folder. Any script in that folder will have its default export bundled into the worker, using the name of the file.

So, `processors/shout/worker/shout.ts`:

```ts
export default function () {
  console.log('OI YOU');
}
```

…will be bundled into the worker and exposed via comlink as `shout()`.

# Folders

Within a feature, files in the:

- `client` folder will be part of the client project.
- `worker` folder will be part of the worker project.
- `shared` folder will be part of the shared project. Both the client and worker projects can access the shared project.

# Encoder format

Encoders must have the following:

`shared/meta.ts` which exposes the following:

- `label` - The name of the codec as displayed to the user.
- `mimeType` - The mime type to be used when generating the output file.
- `extension` - The file extension to be used when generating the output file.
- `EncodeOptions` - An interface for the codec's options.
- `defaultOptions` - An object of type `EncodeOptions`.

`client/index.ts` which exposes the following:

- `encode` - A method which takes args:
  - `AbortSignal`
  - `WorkerBridge`
  - `ImageData`
  - `EncodeOptions`

And returns (a promise for) an `ArrayBuffer`.

Optionally it may export a method `featureTest`, which returns a boolean indicating support for this decoder.

Optionally it may export a component, `Options`, with the following props:

```ts
interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}
```

…where `EncodeOptions` are the options for that encoder.
