import { h, Component } from 'preact';

import { bind, linkRef, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../Output';
import Options from '../Options';
import { FileDropEvent } from './custom-els/FileDrop';
import './custom-els/FileDrop';

import * as quantizer from '../../codecs/imagequant/quantizer';
import * as optiPNG from '../../codecs/optipng/encoder';
import * as mozJPEG from '../../codecs/mozjpeg/encoder';
import * as webP from '../../codecs/webp/encoder';
import * as identity from '../../codecs/identity/encoder';
import * as browserPNG from '../../codecs/browser-png/encoder';
import * as browserJPEG from '../../codecs/browser-jpeg/encoder';
import * as browserWebP from '../../codecs/browser-webp/encoder';
import * as browserGIF from '../../codecs/browser-gif/encoder';
import * as browserTIFF from '../../codecs/browser-tiff/encoder';
import * as browserJP2 from '../../codecs/browser-jp2/encoder';
import * as browserBMP from '../../codecs/browser-bmp/encoder';
import * as browserPDF from '../../codecs/browser-pdf/encoder';
import {
    EncoderState,
    EncoderType,
    EncoderOptions,
    encoderMap,
} from '../../codecs/encoders';
import SnackBarElement from '../../lib/SnackBar';
import '../../lib/SnackBar';

import {
  PreprocessorState,
  defaultPreprocessorState,
} from '../../codecs/preprocessors';

import { decodeImage } from '../../codecs/decoders';
import { cleanMerge, cleanSet } from '../../lib/clean-modify';

type Orientation = 'horizontal' | 'vertical';

interface SourceImage {
  file: File;
  bmp: ImageBitmap;
  data: ImageData;
}

interface EncodedImage {
  preprocessed?: ImageData;
  bmp?: ImageBitmap;
  file?: File;
  downloadUrl?: string;
  preprocessorState: PreprocessorState;
  encoderState: EncoderState;
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
  orientation: Orientation;
}

interface UpdateImageOptions {
  skipPreprocessing?: boolean;
}

async function preprocessImage(
  source: SourceImage,
  preprocessData: PreprocessorState,
): Promise<ImageData> {
  let result = source.data;
  if (preprocessData.quantizer.enabled) {
    result = await quantizer.quantize(result, preprocessData.quantizer);
  }
  return result;
}
async function compressImage(
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
): Promise<File> {
  const compressedData = await (() => {
    switch (encodeData.type) {
      case optiPNG.type: return optiPNG.encode(image, encodeData.options);
      case mozJPEG.type: return mozJPEG.encode(image, encodeData.options);
      case webP.type: return webP.encode(image, encodeData.options);
      case browserPNG.type: return browserPNG.encode(image, encodeData.options);
      case browserJPEG.type: return browserJPEG.encode(image, encodeData.options);
      case browserWebP.type: return browserWebP.encode(image, encodeData.options);
      case browserGIF.type: return browserGIF.encode(image, encodeData.options);
      case browserTIFF.type: return browserTIFF.encode(image, encodeData.options);
      case browserJP2.type: return browserJP2.encode(image, encodeData.options);
      case browserBMP.type: return browserBMP.encode(image, encodeData.options);
      case browserPDF.type: return browserPDF.encode(image, encodeData.options);
      default: throw Error(`Unexpected encoder ${JSON.stringify(encodeData)}`);
    }
  })();

  const encoder = encoderMap[encodeData.type];

  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.extension}`),
    { type: encoder.mimeType },
  );
}

export default class App extends Component<Props, State> {
  widthQuery = window.matchMedia('(min-width: 500px)');

  state: State = {
    loading: false,
    images: [
      {
        preprocessorState: defaultPreprocessorState,
        encoderState: { type: identity.type, options: identity.defaultOptions },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
      {
        preprocessorState: defaultPreprocessorState,
        encoderState: { type: mozJPEG.type, options: mozJPEG.defaultOptions },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
    ],
    orientation: this.widthQuery.matches ? 'horizontal' : 'vertical',
  };

  private snackbar?: SnackBarElement;

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

    this.widthQuery.addListener(this.onMobileWidthChange);
  }

  @bind
  onMobileWidthChange() {
    this.setState({ orientation: this.widthQuery.matches ? 'horizontal' : 'vertical' });
  }

  onEncoderTypeChange(index: 0 | 1, newType: EncoderType): void {
    this.setState({
      images: cleanSet(this.state.images, `${index}.encoderState`, {
        type: newType,
        options: encoderMap[newType].defaultOptions,
      }),
    });
  }

  onPreprocessorOptionsChange(index: 0 | 1, options: PreprocessorState): void {
    this.setState({
      images: cleanSet(this.state.images, `${index}.preprocessorState`, options),
    });
  }

  onEncoderOptionsChange(index: 0 | 1, options: EncoderOptions): void {
    this.setState({
      images: cleanSet(this.state.images, `${index}.encoderState.options`, options),
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { source, images } = this.state;

    for (const [i, image] of images.entries()) {
      const prevImage = prevState.images[i];
      const sourceChanged = source !== prevState.source;
      const encoderChanged = image.encoderState !== prevImage.encoderState;
      const preprocessorChanged = image.preprocessorState !== prevImage.preprocessorState;

      // The image only needs updated if the encoder settings have changed, or the source has
      // changed.
      if (sourceChanged || encoderChanged || preprocessorChanged) {
        if (prevImage.downloadUrl) URL.revokeObjectURL(prevImage.downloadUrl);
        this.updateImage(i, {
          skipPreprocessing: !sourceChanged && !preprocessorChanged,
        }).catch((err) => {
          console.error(err);
        });
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
      const bmp = await decodeImage(file);
      // compute the corresponding ImageData once since it only changes when the file changes:
      const data = await bitmapToImageData(bmp);

      this.setState({
        source: { data, bmp, file },
        loading: false,
      });
    } catch (err) {
      console.error(err);
      this.showError(`Invalid image`);
      this.setState({ loading: false });
    }
  }

  async updateImage(index: number, options: UpdateImageOptions = {}): Promise<void> {
    const { skipPreprocessing = false } = options;
    const { source } = this.state;
    if (!source) return;

    // Each time we trigger an async encode, the counter changes.
    const loadingCounter = this.state.images[index].loadingCounter + 1;

    let images = cleanMerge(this.state.images, index, {
      loadingCounter,
      loading: true,
    });

    this.setState({ images });

    const image = images[index];

    let file;
    try {
      // Special case for identity
      if (image.encoderState.type === identity.type) {
        file = source.file;
      } else {
        if (!skipPreprocessing || !image.preprocessed) {
          image.preprocessed = await preprocessImage(source, image.preprocessorState);
        }
        file = await compressImage(image.preprocessed, image.encoderState, source.file.name);
      }
    } catch (err) {
      this.showError(`Encoding error (type=${image.encoderState.type}): ${err}`);
      throw err;
    }

    const latestImage = this.state.images[index];
    // If a later encode has landed before this one, return.
    if (loadingCounter < latestImage.loadedCounter) {
      return;
    }

    let bmp;
    try {
      bmp = await decodeImage(file);
    } catch (err) {
      this.setState({ error: `Encoding error (type=${image.encoderState.type}): ${err}` });
      throw err;
    }

    images = cleanMerge(this.state.images, '' + index, {
      file,
      bmp,
      downloadUrl: URL.createObjectURL(file),
      loading: images[index].loadingCounter !== loadingCounter,
      loadedCounter: loadingCounter,
    });

    this.setState({ images });
  }

  showError (error: string) {
    if (!this.snackbar) throw Error('Snackbar missing');
    this.snackbar.showSnackbar({ message: error });
  }

  render({ }: Props, { loading, images, source, orientation }: State) {
    const [leftImageBmp, rightImageBmp] = images.map(i => i.bmp);
    const anyLoading = loading || images.some(image => image.loading);

    return (
      <file-drop accept="image/*" onfiledrop={this.onFileDrop}>
        <div id="app" class={`${style.app} ${style[orientation]}`}>
          {(leftImageBmp && rightImageBmp) ? (
            <Output
              orientation={orientation}
              leftImg={leftImageBmp}
              rightImg={rightImageBmp}
            />
          ) : (
            <div class={style.welcome}>
              <h1>Drop, paste or select an image</h1>
              <input type="file" onChange={this.onFileChange} />
            </div>
          )}
          {(leftImageBmp && rightImageBmp) && images.map((image, index) => (
            <Options
              orientation={orientation}
              imageIndex={index}
              imageFile={image.file}
              sourceImageFile={source && source.file}
              downloadUrl={image.downloadUrl}
              preprocessorState={image.preprocessorState}
              encoderState={image.encoderState}
              onEncoderTypeChange={this.onEncoderTypeChange.bind(this, index)}
              onEncoderOptionsChange={this.onEncoderOptionsChange.bind(this, index)}
              onPreprocessorOptionsChange={this.onPreprocessorOptionsChange.bind(this, index)}
            />
          ))}
          {anyLoading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </div>
      </file-drop>
    );
  }
}
