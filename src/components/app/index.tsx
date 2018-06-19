import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';

import { Encoder } from '../../lib/codec-wrappers/codec';
import MozJpegEncoder from '../../lib/codec-wrappers/mozjpeg-enc.worker';

export type ImageType = 'original' | 'jpeg';

export type CodecOptions = any;

const ENCODER_NAMES = {
  original: 'Original Image',
  jpeg: 'JPEG'
};

const ENCODERS = {
  jpeg: MozJpegEncoder
};

type Props = {};

type State = {
  sourceImg?: ImageBitmap,
  sourceData?: ImageData,
  leftImg?: ImageBitmap,
  rightImg?: ImageBitmap,
  loading: boolean
  leftType: ImageType,
  rightType: ImageType,
  leftOptions: CodecOptions,
  rightOptions: CodecOptions
};

export default class App extends Component<Props, State> {
  state: State = {
    loading: false,
    leftType: 'original',
    rightType: 'jpeg',
    leftOptions: {},
    rightOptions: {}
  };

  optionsUpdateTimer?: NodeJS.Timer | number | null;

  constructor() {
    super();
    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      this.componentDidUpdate = () => {
        window.STATE = this.state;
      };
    }
  }

  getEncoderName(type: ImageType, options: CodecOptions) {
    const name = EncoderNames[type];
    if (typeof name === 'function') return name(options);
    return name;
  }

  @bind
  setLeftType(leftType: ImageType) {
    this.setState({ leftType, leftOptions: {} });
    this.optionsUpdated();
  }

  @bind
  setRightType(rightType: ImageType) {
    this.setState({ rightType, rightOptions: {} });
    this.optionsUpdated();
  }

  @bind
  setLeftOptions(leftOptions: any) {
    this.setState({ leftOptions });
    this.optionsUpdated();
  }

  @bind
  setRightOptions(rightOptions: any) {
    this.setState({ rightOptions });
    this.optionsUpdated();
  }

  optionsUpdated() {
    if (!this.optionsUpdateTimer) {
      this.optionsUpdateTimer = setTimeout(this.commitOptionsUpdated, 500);
    }
  }

  @bind
  commitOptionsUpdated() {
    this.optionsUpdateTimer = null;
    this.updateImages();
  }

  @bind
  async onFileChange(event: Event) {
    this.setState({ loading: true });
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || !fileInput.files[0]) return;
    // TODO: handle decode error
    const sourceImg = await createImageBitmap(fileInput.files[0]);
    // compute the corresponding ImageData once since it only changes when the file changes:
    const sourceData = await bitmapToImageData(sourceImg);
    this.setState({ sourceImg, sourceData, loading: false });
    this.updateImages();
  }

  async updateImages() {
    const { sourceData, leftType, rightType, leftOptions, rightOptions } = this.state;
    if (!sourceData) return;
    const id = ++this.compressCounter;
    this.setState({ loading: true });
    const [leftImg, rightImg] = await Promise.all([
      this.updateCompressedImage(sourceData, leftType, leftOptions),
      this.updateCompressedImage(sourceData, rightType, rightOptions)
    ]);
    if (this.compressCounter !== id) return;
    this.setState({ leftImg, rightImg, loading: false });
  }

  async updateCompressedImage(sourceData: ImageData, type: ImageType, options: CodecOptions) {
    try {
      const encoder = await new ENCODERS[type]() as Encoder;
      const compressedData = await encoder.encode(sourceData, options);
      let imageData;
      if (compressedData instanceof ArrayBuffer) {
        imageData = new Blob([compressedData], { type: ENCODERS[type].mimeType || '' });
      } else {
        imageData = compressedData;
      }
      const result = await createImageBitmap(imageData);
      return result;
    } catch (err) {
      console.error(`Encoding error (type=${type}): ${err}`);
      }
    }

  }

  render({ }: Props, { loading, leftType, leftOptions, rightType, rightOptions, leftImg, rightImg }: State) {
    return (
      <div id="app" class={style.app}>
        {leftImg && rightImg ? (
          <Output leftImg={leftImg} rightImg={rightImg} />
        ) : (
            <div class={style.welcome}>
              <h1>Select an image</h1>
              <input type="file" onChange={this.onFileChange} />
            </div>
          )}
        <span class={style.leftLabel}>{this.getEncoderName(leftType, leftOptions)}</span>
        <span class={style.rightLabel}>{this.getEncoderName(rightType, rightOptions)}</span>
        <Options
          class={style.leftOptions}
          name="Left"
          type={leftType}
          options={leftOptions}
          onTypeChange={this.setLeftType}
          onOptionsChange={this.setLeftOptions}
        />
        <Options
          class={style.rightOptions}
          name="Right"
          type={rightType}
          options={rightOptions}
          onTypeChange={this.setRightType}
          onOptionsChange={this.setRightOptions}
        />
        {loading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
      </div>
    );
  }
}
