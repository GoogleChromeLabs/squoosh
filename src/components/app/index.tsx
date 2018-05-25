import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';

import { Encoder } from '../../lib/codec-wrappers/codec';
import { MozJpegEncoder } from '../../lib/codec-wrappers/mozjpeg-enc';

export type ImageType = 'original' | 'jpeg';

export type CodecOptions = any;

type Encoders = {
  [type: string]: new () => Encoder
};

const EncoderNames = {
  original: 'Original Image',
  jpeg: (options: CodecOptions) => `JPEG ${options.quality || ''}`
};

const AllEncoders: Encoders = {
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

  compressCounter = 0;

  retries = 0;

  encoders: Encoders = {};

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

  async updateCompressedImage(sourceData: ImageData, type: ImageType, options: CodecOptions, retries= 0) {
    if (type === 'original') {
      return this.state.sourceImg;
    }
    // @todo reuse here crashes
    // let encoder = this.encoders[type];
    // if (!encoder) {
    //   encoder = this.encoders[type] = new AllEncoders[type]();
    // }
    // if (!encoder) {
    //   console.error(`Unknown encoder: ${type}`);
    //   return;
    // }
    const encoder = new AllEncoders[type]();
    try {
      const compressedData = await encoder.encode(sourceData, options);
      const blob = new Blob([compressedData], { type: 'image/jpeg' });
      return await createImageBitmap(blob);
    } catch (err) {
      // console.log(`failed to encode ${type} (retries: ${retries}): ${err}`);
      if (retries < 5) {
        await this.updateCompressedImage(sourceData, type, options, retries + 1);
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
