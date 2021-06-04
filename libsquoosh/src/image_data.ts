export default class ImageData {
  readonly data: Uint8ClampedArray | Uint8Array;
  readonly width: number;
  readonly height: number;

  constructor(
    data: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number,
  ) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
