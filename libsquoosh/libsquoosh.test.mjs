import { ImagePool } from './build/index.js';

console.log("Starting");
const imagePool = new ImagePool();
// const imagePath = '/Users/surma/Downloads/happy_dog.png';
const imagePath = './squoosh.png';
console.log("INgesting");
const image = imagePool.ingestImage(imagePath);
console.log("Decoding");
await image.decoded;
const encodeOptions = {
  mozjpeg: 'auto',
};
console.log("Encoding");
await image.encode(encodeOptions);
console.log("Closing");
await imagePool.close();
console.log("Done");