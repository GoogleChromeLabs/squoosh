# libSquoosh

libSquoosh is an _experimental_ way to run all the codecs you know from the [Squoosh] web app directly inside your own JavaScript program. libSquoosh uses a worker pool to parallelize processing images. This way you can apply the same codec to many images at once.

libSquoosh is currently not the fastest image compression tool in town and doesn’t aim to be. It is, however, fast enough to compress many images sufficiently quick at once.

## Installation

libSquoosh can be installed to your local project with the following command:

```
$ npm install @squoosh/lib
```

You can start using the libSquoosh by adding these lines to the top of your JS program:

```js
import { ImagePool } from '@squoosh/lib';
const imagePool = new ImagePool();
```

This will create an image pool with an underlying processing pipeline that you can use to ingest and encode images. The ImagePool constructor takes one argument that defines how many parallel operations it is allowed to run at any given time. By default, this number is set to the amount of CPU cores available in the system it is running on.

## Ingesting images

You can ingest a new image like so:

```js
const imagePath = 'path/to/image.png';
const image = imagePool.ingestImage(imagePath);
```

The `ingestImage` function can take anything the node [`readFile`][readfile] function can take, uncluding a buffer and `FileHandle`.

The returned `image` object is a representation of the original image, that you can now preprocess, encode, and extract information about.

## Preprocessing and encoding images

When an image has been ingested, you can start preprocessing it and encoding it to other formats. This example will resize the image and then encode it to a `.jpg` and `.jxl` image:

```js
await image.decoded; //Wait until the image is decoded before running preprocessors. 

const preprocessOptions = {
  //When both width and height are specified, the image resized to specified size.
  resize: {
    enabled: true,
    width: 100,
    height: 50,
  }
  /*
  //When either width or height is specified, the image resized to specified size keeping aspect ratio.
  resize: {
    enabled: true,
    width: 100,
  }
  */
}
await image.preprocess(preprocessOptions);

const encodeOptions = {
  mozjpeg: {}, //an empty object means 'use default settings'
  jxl: {
    quality: 90,
  },
}
await image.encode(encodeOptions);

```

The default values for each option can be found in the [`codecs.ts`][codecs.ts] file under `defaultEncoderOptions`. Every unspecified value will use the default value specified there. _Better documentation is needed here._

You can run your own code inbetween the different steps, if, for example, you want to change how much the image should be resized based on its original height. (See [Extracting image information](#extracting-image-information) to learn how to get the image dimensions).

## Closing the ImagePool

When you have encoded everything you need, it is recommended to close the processing pipeline in the ImagePool. This will not delete the images you have already encoded, but it will prevent you from ingesting and encoding new images.

Close the ImagePool pipeline with this line:

```js
await imagePool.close();
```

## Writing encoded images to the file system

When you have encoded an image, you normally want to write it to a file.

This example takes an image that has been encoded as a `jpg` and writes it to a file:

```js
const rawEncodedImage = (await image.encodedWith.mozjpeg).binary;

fs.writeFile('/path/to/new/image.jpg', rawEncodedImage);
```

This example iterates through all encoded versions of the image and writes them to a specific path:

```js
const newImagePath = '/path/to/image.'; //extension is added automatically

for (const encodedImage of Object.values(image.encodedWith)) {
  fs.writeFile(
    newImagePath + (await encodedImage).extension,
    (await encodedImage).binary,
  );
}
```

## Extracting image information

Information about a decoded image is available at `Image.decoded`. It looks something like this:

```js
console.log(await image.decoded);
// Returns:
{
 bitmap: {
    data: Uint8ClampedArray(47736584) [
      225, 228, 237, 255, 225, 228, 237, 255, 225, 228, 237, 255,
      225, 228, 237, 255, 225, 228, 237, 255, 225, 228, 237, 255,
      225, 228, 237, 255,
      ... //the entire raw image
    ],
    width: 4606,  //pixels
    height: 2591  //pixels
  },
  size: 2467795  //bytes
}
```

Information about an encoded image can be found at `Image.encodedWith[encoderName]`. It looks something like this:

```js
console.log(await image.encodedWith.jxl);
// Returns:
{
  optionsUsed: {
    quality: 75,
    baseline: false,
    arithmetic: false,
    progressive: true,
    ... //all the possible options for this encoder
  },
  binary: Uint8Array(1266975) [
      1,   0,   0,   1,   0,  1,  0,  0, 255, 219,  0, 132,
    113, 119, 156, 156, 209,  1,  8,  8,   8,   8,  9,   8,
      9,  10,  10,   9,
    ... //the entire raw encoded image
  ],
  extension: 'jxl',
  size: 1266975  //bytes
}
```

## Auto optimizer

libSquoosh has an _experimental_ auto optimizer that compresses an image as much as possible, trying to hit a specific [Butteraugli] target value. The higher the Butteraugli target value, the more artifacts can be introduced.

You can make use of the auto optimizer by using “auto” as the config object.

```js
const encodeOptions: {
  mozjpeg: 'auto',
}
```

[squoosh]: https://squoosh.app
[codecs.ts]: https://github.com/GoogleChromeLabs/squoosh/blob/dev/libsquoosh/src/codecs.ts
[butteraugli]: https://github.com/google/butteraugli
[readfile]: https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
