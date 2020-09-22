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
