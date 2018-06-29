import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';
import { FileDropEvent } from './custom-els/FileDrop';
import './custom-els/FileDrop';

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
  loading: boolean;
  /** Counter of the latest bmp currently encoding */
  loadingCounter: number;
  /** Counter of the latest bmp encoded */
  loadedCounter: number;
}

interface Props {}

interface State {
  source?: SourceImage;
  images: [EncodedImage, EncodedImage];
  loading: boolean;
  error?: string;
}

async function updateCompressedImage(
  source: SourceImage,
  encodeData: EncoderState,
): Promise<ImageBitmap> {
  // Special case for identity
  if (encodeData.type === identity.type) return source.bmp;

  const compressedData = await (() => {
    switch (encodeData.type) {
      case mozJPEG.type: return mozJPEG.encode(source.data, encodeData.options);
      default: throw Error(`Unexpected encoder name`);
    }
  })();

  const blob = new Blob([compressedData], {
    type: encoderMap[encodeData.type].mimeType,
  });

  const bitmap = await createImageBitmap(blob);
  return bitmap;
}

export default class App extends Component<Props, State> {
  state: State = {
    loading: false,
    images: [
      {
        encoderState: { type: identity.type, options: identity.defaultOptions },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
      {
        encoderState: { type: mozJPEG.type, options: mozJPEG.defaultOptions },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
    ],
  };

  constructor() {
    super();
    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      const oldCDU = this.componentDidUpdate;
      this.componentDidUpdate = (props, state) => {
        if (oldCDU) oldCDU.call(this, props, state);
        window.STATE = this.state;
      };
    }
  }

  onEncoderChange(index: 0 | 1, type: EncoderType, options?: EncoderOptions): void {
    const images = this.state.images.slice() as [EncodedImage, EncodedImage];
    const oldImage = images[index];

    // Some type cheating here.
    // encoderMap[type].defaultOptions is always safe.
    // options should always be correct for the type, but TypeScript isn't smart enough.
    const encoderState: EncoderState = {
      type,
      options: options ? options : encoderMap[type].defaultOptions,
    } as EncoderState;

    images[index] = {
      ...oldImage,
      encoderState,
    };

    this.setState({ images });
  }

  onOptionsChange(index: 0 | 1, options: EncoderOptions): void {
    this.onEncoderChange(index, this.state.images[index].encoderState.type, options);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { source, images } = this.state;

    for (const [i, image] of images.entries()) {
      if (source !== prevState.source || image.encoderState !== prevState.images[i].encoderState) {
        this.updateImage(i);
      }
    }
  }

  @bind
  async onFileChange(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    await this.updateFile(file);
  }

  @bind
  async onFileDrop(event: FileDropEvent) {
    const { file } = event;
    if (!file) return;
    await this.updateFile(file);
  }

  async updateFile(file: File) {
    this.setState({ loading: true });
    try {
      const bmp = await createImageBitmap(file);
      // compute the corresponding ImageData once since it only changes when the file changes:
      const data = await bitmapToImageData(bmp);

      this.setState({
        source: { data, bmp, file },
        error: undefined,
        loading: false,
      });
    } catch (err) {
      this.setState({ error: 'IMAGE_INVALID', loading: false });
    }
  }

  async updateImage(index: number): Promise<void> {
    const { source } = this.state;
    if (!source) return;
    let images = this.state.images.slice() as [EncodedImage, EncodedImage];

    // Each time we trigger an async encode, the counter changes.
    const loadingCounter = images[index].loadingCounter + 1;

    const image = images[index] = {
      ...images[index],
      loadingCounter,
      loading: true,
    };

    this.setState({ images });

    let result;

    try {
      result = await updateCompressedImage(source, image.encoderState);
    } catch (err) {
      this.setState({ error: `Encoding error (type=${image.encoderState.type}): ${err}` });
      throw err;
    }

    const latestImage = this.state.images[index];
    // If a later encode has landed before this one, return.
    if (loadingCounter < latestImage.loadedCounter) {
      this.setState({ error: '' });
      return;
    }

    images = this.state.images.slice() as [EncodedImage, EncodedImage];

    images[index] = {
      ...images[index],
      bmp: result,
      loading: image.loadingCounter !== loadingCounter,
      loadedCounter: loadingCounter,
    };

    this.setState({ images, error: '' });
  }

  render({ }: Props, { loading, error, images }: State) {
    const [leftImageBmp, rightImageBmp] = images.map(i => i.bmp);

    const anyLoading = loading || images.some(image => image.loading);

    return (
      <file-drop accept="image/*" onfiledrop={this.onFileDrop}>
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
            <span class={index ? style.rightLabel : style.leftLabel}>
              {encoderMap[image.encoderState.type].label}
            </span>
          ))}
          {images.map((image, index) => (
            <Options
              class={index ? style.rightOptions : style.leftOptions}
              encoderState={image.encoderState}
              onTypeChange={this.onEncoderChange.bind(this, index)}
              onOptionsChange={this.onOptionsChange.bind(this, index)}
            />
          ))}
          {anyLoading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
          {error && <span style={{ position: 'fixed', top: 0, left: 0 }}>Error: {error}</span>}
        </div>
      </file-drop>
    );
  }
}
