import { h, Component } from 'preact';

import { bind, linkRef } from '../../lib/util';
import * as style from './style.scss';
import Output from '../Output';
import Options from '../Options';
import { FileDropEvent } from './custom-els/FileDrop';
import './custom-els/FileDrop';
import ResultCache from './result-cache';

import * as quantizer from '../../codecs/imagequant/quantizer';
import * as optiPNG from '../../codecs/optipng/encoder';
import * as resizer from '../../codecs/resize/resize';
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

export interface SourceImage {
  file: File;
  data: ImageData;
}

interface EncodedImage {
  preprocessed?: ImageData;
  file?: File;
  downloadUrl?: string;
  data?: ImageData;
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

let createFile = (function () {
  // Edge doesn't support `new File`, so here's a hacky alternative.
  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9551546/
  function createFileEdge(data: ArrayBuffer | Blob, filename: string, type: string): File {
    const blob = new Blob([data], { type });
    (blob as any).name = filename;
    return blob as File;
  }

  return function (data: ArrayBuffer | Blob, filename: string, type: string): File {
    try {
      return new File([data], filename, { type });
    } catch (err) {
      // Fall back to the hack.
      createFile = createFileEdge;
      return createFile(data, filename, type);
    }
  };
})();

async function preprocessImage(
  source: SourceImage,
  preprocessData: PreprocessorState,
): Promise<ImageData> {
  let result = source.data;
  if (preprocessData.resize.enabled) {
    result = resizer.resize(result, preprocessData.resize);
  }
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

  return createFile(
    compressedData,
    sourceFilename.replace(/.[^.]*$/, `.${encoder.extension}`),
    encoder.mimeType,
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

  snackbar?: SnackBarElement;
  readonly encodeCache = new ResultCache();

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

      // The image only needs updated if the encoder/preprocessor settings have changed, or the
      // source has changed.
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

  onCopyToOtherClick(index: 0 | 1) {
    const otherIndex = (index + 1) % 2;

    this.setState({
      images: cleanSet(this.state.images, otherIndex, this.state.images[index]),
    });
  }

  async updateFile(file: File) {
    this.setState({ loading: true });
    try {
      const data = await decodeImage(file);

      let newState = {
        ...this.state,
        source: { data, file },
        loading: false,
      };

      // Default resize values come from the image:
      for (const i of [0, 1]) {
        newState = cleanMerge(newState, `images.${i}.preprocessorState.resize`, {
          width: data.width,
          height: data.height,
        });
      }

      this.setState(newState);
    } catch (err) {
      console.error(err);
      this.showError('Invalid image');
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

    let file: File | undefined;
    let preprocessed: ImageData | undefined;
    let data: ImageData | undefined;
    const cacheResult = this.encodeCache.match(source, image.preprocessorState, image.encoderState);

    if (cacheResult) {
      ({ file, preprocessed, data } = cacheResult);
    } else {
      try {
        // Special case for identity
        if (image.encoderState.type === identity.type) {
          ({ file, data } = source);
        } else {
          preprocessed = (skipPreprocessing && image.preprocessed)
            ? image.preprocessed
            : await preprocessImage(source, image.preprocessorState);

          file = await compressImage(preprocessed, image.encoderState, source.file.name);
          data = await decodeImage(file);

          this.encodeCache.add({
            source,
            data,
            preprocessed,
            file,
            encoderState: image.encoderState,
            preprocessorState: image.preprocessorState,
          });
        }
      } catch (err) {
        this.showError(`Processing error (type=${image.encoderState.type}): ${err}`);
        throw err;
      }
    }

    const latestImage = this.state.images[index];
    // If a later encode has landed before this one, return.
    if (loadingCounter < latestImage.loadedCounter) {
      return;
    }

    images = cleanMerge(this.state.images, index, {
      file,
      data,
      preprocessed,
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
    const [leftImage, rightImage] = images;
    const [leftImageData, rightImageData] = images.map(i => i.data);
    const anyLoading = loading || images.some(image => image.loading);

    return (
      <file-drop accept="image/*" onfiledrop={this.onFileDrop}>
        <div id="app" class={`${style.app} ${style[orientation]}`}>
          {(leftImageData && rightImageData && source) ? (
            <Output
              orientation={orientation}
              imgWidth={source.data.width}
              imgHeight={source.data.height}
              leftImg={leftImageData}
              rightImg={rightImageData}
              leftImgContain={leftImage.preprocessorState.resize.fitMethod === 'cover'}
              rightImgContain={rightImage.preprocessorState.resize.fitMethod === 'cover'}
            />
          ) : (
            <div class={style.welcome}>
              <h1>Drop, paste or select an image</h1>
              <input type="file" onChange={this.onFileChange} />
            </div>
          )}
          {(leftImageData && rightImageData && source) && images.map((image, index) => (
            <Options
              orientation={orientation}
              sourceAspect={source.data.width / source.data.height}
              imageIndex={index}
              imageFile={image.file}
              sourceImageFile={source && source.file}
              downloadUrl={image.downloadUrl}
              preprocessorState={image.preprocessorState}
              encoderState={image.encoderState}
              onEncoderTypeChange={this.onEncoderTypeChange.bind(this, index)}
              onEncoderOptionsChange={this.onEncoderOptionsChange.bind(this, index)}
              onPreprocessorOptionsChange={this.onPreprocessorOptionsChange.bind(this, index)}
              onCopyToOtherClick={this.onCopyToOtherClick.bind(this, index)}
            />
          ))}
          {anyLoading && <span style={{ position: 'fixed', top: 0, left: 0 }}>Loading...</span>}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </div>
      </file-drop>
    );
  }
}
