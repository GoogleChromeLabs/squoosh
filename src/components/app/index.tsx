import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';
import './custom-els/FileDrop';

import { Encoder } from '../../codecs/codec';
import IdentityEncoder from '../../codecs/identity/encoder';
import MozJpegEncoder from '../../codecs/mozjpeg/encoder.worker';

export type ImageType = 'original' | 'MozJpeg';

export type CodecOptions = any;

const ENCODER_NAMES = {
  original: 'Original Image',
  MozJpeg: 'JPEG'
};

const ENCODER_EXTENSION = {
  original: '',
  MozJpeg: 'jpeg'
};

const ENCODERS = {
  original: IdentityEncoder,
  MozJpeg: MozJpegEncoder
};

type Image = {
  type: ImageType,
  options: CodecOptions,
  data?: ImageBitmap,
  downloadUrl: string,
  extension: string,
  counter: number,
  loading: boolean
};

type CompressedImage = {
  data: ImageData | Blob;
  type: string;
};

type Props = {};

type State = {
  sourceFile?: File,
  sourceImg?: ImageBitmap,
  sourceData?: ImageData,
  images: Array<Image>,
  loading: boolean,
  error?: string
};

function initialState(): State {
  return {
    loading: false,
    images: [
      { type: 'original', options: {}, loading: false, counter: 0, downloadUrl: '', extension: '' },
      { type: 'MozJpeg', options: { quality: 7 }, loading: false, counter: 0, downloadUrl: '', extension: ENCODER_EXTENSION['MozJpeg'] }
    ]
  };
}

export default class App extends Component<Props, State> {
  state: State = initialState();

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

  setImageTypeAndOptions(index: number, type?: ImageType, options: any = {}) {
    const images = this.state.images.slice();
    const image = images[index];
    images[index] = {
      ...image,
      type: type || image.type,
      options,
      loading: false,
      counter: image.counter + 1
    };
    this.setState({ images });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { sourceImg, sourceData, images } = this.state;
    for (let i = 0; i < images.length; i++) {
      if (sourceData !== prevState.sourceData || images[i] !== prevState.images[i]) {
        URL.revokeObjectURL(images[i].downloadUrl);
        this.updateImage(i);
      }
    }
    if (sourceImg !== prevState.sourceImg && prevState.sourceImg) {
      prevState.sourceImg.close();
    }
  }

  @bind
  async onFileChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const sourceFile = fileInput.files && fileInput.files[0];
    if (!sourceFile) return;
    await this.updateFile(sourceFile);
  }

  @bind
  async onFileDrop(event: CustomEvent) {
    const sourceFile = event.detail as File;
    this.setState(initialState());

    if (!sourceFile) return;
    await this.updateFile(sourceFile);
  }

  async updateFile(sourceFile: File) {
    this.setState({ loading: true });
    try {
      const sourceImg = await createImageBitmap(sourceFile);
      // compute the corresponding ImageData once since it only changes when the file changes:
      const sourceData = await bitmapToImageData(sourceImg);
      this.setState({ sourceFile, sourceImg, sourceData, error: undefined, loading: false });
    } catch (err) {
      this.setState({ error: 'IMAGE_INVALID', loading: false });
    }
  }

  async updateImage(index: number) {
    const { sourceData, sourceFile, images } = this.state;
    if (!sourceData) return;
    let image = images[index];
    // Each time we trigger an async encode, the ID changes.
    const id = ++image.counter;
    image.loading = true;
    this.setState({ });
    if (image.type === 'original' && sourceFile) {
      image.extension = sourceFile.name.split('.').pop() || '';
      // If we don't use this then image data is a bitmap from identity encoder.
      image.downloadUrl = URL.createObjectURL(new Blob([sourceFile]));
    }
    const compressedImage = await this.updateCompressedImage(sourceData, image.type, image.options);
    const imageBitmap = await createImageBitmap(compressedImage.data);
    image = this.state.images[index];
    // If another encode has been intiated since we started, ignore this one.
    if (image.counter !== id) return;
    image.data = imageBitmap;
    if (image.type !== 'original') {
      if (compressedImage.data instanceof Blob) {
        image.downloadUrl = URL.createObjectURL(compressedImage.data);
      } else {
        image.downloadUrl = URL.createObjectURL(new Blob([compressedImage.data.data]));
      }
    }
    image.loading = false;
    this.setState({ });
  }

  async updateCompressedImage(sourceData: ImageData, type: ImageType, options: CodecOptions): Promise<CompressedImage> {
    let imageInfo: CompressedImage = { type: '', data: new Blob() };
    try {
      const encoder = await new ENCODERS[type]() as Encoder;
      const compressedData = await encoder.encode(sourceData, options);
      if (compressedData instanceof ArrayBuffer) {
        imageInfo.data = new Blob([compressedData], {
          type: ENCODERS[type].mimeType || ''
        });
        imageInfo.type = ENCODERS[type].mimeType || '';
      } else if (compressedData instanceof ImageData) {
        imageInfo.data = compressedData;
        imageInfo.type = ENCODERS[type].mimeType || '';
      }
    } catch (err) {
      console.error(`Encoding error (type=${type}): ${err}`);
    }
    return imageInfo;
  }

  render({ }: Props, { loading, error, images }: State) {
    for (let image of images) {
      if (image.loading) loading = true;
    }
    const leftImg = images[0].data;
    const rightImg = images[1].data;

    return (
      <file-drop accepts="image/*" onFileDrop={this.onFileDrop}>
      <div id="app" class={style.app}>
        
        {(leftImg && rightImg) ? (
          <Output leftImg={leftImg} rightImg={rightImg} />
        ) : (
          <div class={style.welcome}>
            <h1>Select an image</h1>
            <input type="file" onChange={this.onFileChange} />
          </div>
        )}
        {images.map((image, index: number) => (
          <span class={index ? style.rightLabel : style.leftLabel}>
            <span>{ENCODER_NAMES[image.type]}</span>
            { (image.data !== undefined) ? (
              (<a href={image.downloadUrl} download={image.type + '.' + image.extension}> 🔻 </a>)
            ) : ('')}
          </span>
        ))}
        {images.map((image, index: number) => (
          <Options
            class={index ? style.rightOptions : style.leftOptions}
            name={index ? 'Right' : 'Left'}
            type={image.type}
            options={image.options}
            onTypeChange={this.setImageTypeAndOptions.bind(this, index)}
            onOptionsChange={this.setImageTypeAndOptions.bind(this, index, null)}
          />
        ))}
        {loading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
        {error && <span style={{ position: 'fixed', top: 0, left: 0 }}>Error: {error}</span>}
      </div>
      </file-drop>
    );
  }
}
