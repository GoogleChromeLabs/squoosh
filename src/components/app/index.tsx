import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';

import * as mozJPEG from '../../codecs/mozjpeg/encoder';
import * as identity from '../../codecs/identity/encoder';
import { EncoderState, EncoderType, EncoderOptions, encoderMap } from '../../codecs/encoders';

interface SourceImage {
  file: File;
  bmp: ImageBitmap;
  data: ImageData;
}

interface EncodedImage {
  encoderState: EncoderState;
  bmp?: ImageBitmap;
  counter: number;
  loading: boolean;
}

interface Props {}

interface State {
  source?: SourceImage;
  images: [EncodedImage, EncodedImage];
  loading: boolean;
  error?: string;
}

export default class App extends Component<Props, State> {
  state: State = {
    loading: false,
    images: [
      {
        encoderState: { type: identity.type, options: identity.defaultOptions },
        counter: 0,
        loading: false
      },
      {
        encoderState: { type: mozJPEG.type, options: mozJPEG.defaultOptions },
        counter: 0,
        loading: false
      }
    ]
  };

  constructor() {
    super();
    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      let oldCDU = this.componentDidUpdate;
      this.componentDidUpdate = (props, state) => {
        if (oldCDU) oldCDU.call(this, props, state);
        window.STATE = this.state;
      };
    }
  }

  onEncoderChange(index: 0 | 1, type: EncoderType, options?: EncoderOptions): void {
    const images = this.state.images.slice() as [EncodedImage, EncodedImage];
    const image = images[index];

    // Some type cheating here.
    // encoderMap[type].defaultOptions is always safe.
    // options should always be correct for the type, but TypeScript isn't smart enough.
    const encoderState: EncoderState = {
      type,
      options: options ? options : encoderMap[type].defaultOptions
    } as EncoderState;

    images[index] = {
      ...image,
      encoderState,
      loading: true,
      counter: image.counter++
    };

    this.setState({ images });
  }

  onOptionsChange(index: 0 | 1, options: EncoderOptions): void {
    this.onEncoderChange(index, this.state.images[index].encoderState.type, options);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { source, images } = this.state;

    for (const [i, image] of images.entries()) {
      if (source !== prevState.source || image !== prevState.images[i]) {
        this.updateImage(i);
      }
    }
  }

  @bind
  async onFileChange(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.setState({ loading: true });
    try {
      const bmp = await createImageBitmap(file);
      // compute the corresponding ImageData once since it only changes when the file changes:
      const data = await bitmapToImageData(bmp);
      this.setState({
        source: { data, bmp, file },
        error: undefined,
        loading: false
      });
    } catch (err) {
      this.setState({ error: 'IMAGE_INVALID', loading: false });
    }
  }

  async updateImage(index: number): Promise<void> {
    const { source, images } = this.state;
    if (!source) return;
    let image = images[index];

    // Each time we trigger an async encode, the ID changes.
    const id = ++image.counter;
    image.loading = true;
    this.setState({ });
    const result = await this.updateCompressedImage(source, image.encoderState);
    image = this.state.images[index];
    // If another encode has been initiated since we started, ignore this one.
    if (image.counter !== id) return;
    image.bmp = result;
    image.loading = false;
    this.setState({ });
  }

  async updateCompressedImage(source: SourceImage, encodeData: EncoderState): Promise<ImageBitmap> {
    // Special case for identity
    if (encodeData.type === identity.type) return source.bmp;

    try {
      const compressedData = await (() => {
        switch (encodeData.type) {
          case mozJPEG.type: return mozJPEG.encode(source.data, encodeData.options);
          default: throw Error(`Unexpected encoder name`);
        }
      })();

      const blob = new Blob([compressedData], {
        type: encoderMap[encodeData.type].mimeType
      });

      const bitmap = await createImageBitmap(blob);
      this.setState({ error: '' });
      return bitmap;
    } catch (err) {
      this.setState({ error: `Encoding error (type=${encodeData.type}): ${err}` });
      throw err;
    }
  }

  render({ }: Props, { loading, error, images, source }: State) {
    const [leftImageBmp, rightImageBmp] = images.map(i => i.bmp);

    loading = loading || images.some(image => image.loading);

    return (
      <div id="app" class={style.app}>
        {(leftImageBmp && rightImageBmp) ? (
          <Output leftImg={leftImageBmp} rightImg={rightImageBmp} />
        ) : (
          <div class={style.welcome}>
            <h1>Select an image</h1>
            <input type="file" onChange={this.onFileChange} />
          </div>
        )}
        {images.map((image, index) => (
          <span class={index ? style.rightLabel : style.leftLabel}>{encoderMap[image.encoderState.type].label}</span>
        ))}
        {images.map((image, index) => (
          <Options
            class={index ? style.rightOptions : style.leftOptions}
            encoderState={image.encoderState}
            onTypeChange={this.onEncoderChange.bind(this, index)}
            onOptionsChange={this.onOptionsChange.bind(this, index)}
          />
        ))}
        {loading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
        {error && <span style={{ position: 'fixed', top: 0, left: 0 }}>Error: {error}</span>}
      </div>
    );
  }
}
