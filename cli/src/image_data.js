export default class ImageData {
  constructor(data, width, height) {
    // Need to manually copy the memory as wasm-bindgen does not by default
    // and by the time we get control in JS land, the memory has already
    // been corrupted.
    // FIXME: This is bad because it’s overhead that we should only need
    // to pay for Rust, not for C++.
    this.data = new Uint8ClampedArray(data);
    this.width = width;
    this.height = height;
  }
}
