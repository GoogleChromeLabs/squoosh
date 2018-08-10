import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';
import BrowserJPEGEncoderOptions from '../../codecs/browser-jpeg/options';
import WebPEncoderOptions from '../../codecs/webp/options';
import BrowserWebPEncoderOptions from '../../codecs/browser-webp/options';

import QuantizerOptionsComponent from '../../codecs/imagequant/options';

import * as identity from '../../codecs/identity/encoder';
import * as mozJPEG from '../../codecs/mozjpeg/encoder';
import * as webP from '../../codecs/webp/encoder';
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
    encoders,
    encodersSupported,
    EncoderSupportMap,
    encoderMap,
} from '../../codecs/encoders';
import { QuantizeOptions } from '../../codecs/imagequant/quantizer';

import { PreprocessorState } from '../../codecs/preprocessors';
import { EncodedImage } from '../App';

import GzipSize from '../GzipSize';
import DownloadIcon from '../../lib/icons/Download';

const encoderOptionsComponentMap = {
  [identity.type]: undefined,
  [mozJPEG.type]: MozJpegEncoderOptions,
  [webP.type]: WebPEncoderOptions,
  [browserPNG.type]: undefined,
  [browserJPEG.type]: BrowserJPEGEncoderOptions,
  [browserWebP.type]: BrowserWebPEncoderOptions,
  [browserBMP.type]: undefined,
  // Only Safari supports the rest, and it doesn't support quality settings.
  [browserGIF.type]: undefined,
  [browserTIFF.type]: undefined,
  [browserJP2.type]: undefined,
  [browserPDF.type]: undefined,
};

interface Props {
  class?: string;
  image: EncodedImage;
  encoderState: EncoderState;
  preprocessorState: PreprocessorState;
  onEncoderTypeChange(newType: EncoderType): void;
  onEncoderOptionsChange(newOptions: EncoderOptions): void;
  onPreprocessorOptionsChange(newOptions: PreprocessorState): void;
}

interface State {
  encoderSupportMap?: EncoderSupportMap;
}

export default class Options extends Component<Props, State> {
  typeSelect?: HTMLSelectElement;

  constructor() {
    super();
    encodersSupported.then(encoderSupportMap => this.setState({ encoderSupportMap }));
  }

  @bind
  onEncoderTypeChange(event: Event) {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as EncoderType;
    this.props.onEncoderTypeChange(type);
  }

  @bind
  onPreprocessorEnabledChange(event: Event) {
    const el = event.currentTarget as HTMLInputElement;

    const preprocessor = el.name.split('.')[0] as keyof PreprocessorState;

    this.props.onPreprocessorOptionsChange({
      ...this.props.preprocessorState,
      [preprocessor]: {
        ...this.props.preprocessorState[preprocessor],
        enabled: el.checked,
      },
    });
  }

  @bind
  onQuantizerOptionsChange(opts: QuantizeOptions) {
    this.props.onPreprocessorOptionsChange({
      ...this.props.preprocessorState,
      quantizer: {
        ...opts,
        enabled: this.props.preprocessorState.quantizer.enabled,
      },
    });
  }

  render(
    { image, class: className, encoderState, preprocessorState, onEncoderOptionsChange }: Props,
    { encoderSupportMap }: State,
  ) {
    // tslint:disable variable-name
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={`${style.options}${className ? (' ' + className) : ''}`}>
        <h2 class={style.title}>
          {className && className.match(/left/) ? 'Left Image' : 'Right Image'}
          {', '}
          {encoderMap[encoderState.type].label}

          {(image.downloadUrl && image.file) && (
            <a
              class={style.download}
              href={image.downloadUrl}
              download={image.file.name}
              title="Download"
            >
              <DownloadIcon />
            </a>
          )}
        </h2>

        <section class={style.picker}>
          {encoderSupportMap ?
            <select value={encoderState.type} onChange={this.onEncoderTypeChange}>
              {encoders.filter(encoder => encoderSupportMap[encoder.type]).map(encoder => (
                <option value={encoder.type}>{encoder.label}</option>
              ))}
            </select>
            :
            <select><option>Loading…</option></select>
          }
        </section>

        {encoderState.type !== 'identity' && (
          <div key="quantization" class={style.quantization}>
            <label class={style.toggle}>
              <input
                name="quantizer.enable"
                type="checkbox"
                checked={!!preprocessorState.quantizer.enabled}
                onChange={this.onPreprocessorEnabledChange}
              />
              Enable Quantization
            </label>
            {preprocessorState.quantizer.enabled &&
              <QuantizerOptionsComponent
                options={preprocessorState.quantizer}
                onChange={this.onQuantizerOptionsChange}
              />
            }
          </div>
        )}

        {EncoderOptionComponent &&
          <EncoderOptionComponent
            options={
              // Casting options, as encoderOptionsComponentMap[encodeData.type] ensures the correct
              // type, but typescript isn't smart enough.
              encoderState.options as typeof EncoderOptionComponent['prototype']['props']['options']
            }
            onChange={onEncoderOptionsChange}
          />
        }

        <div class={style.sizeDetails}>
          <GzipSize
            // @todo: once we have a nice way to pass down the original image
            // (image size?), pass compareTo prop here to show size delta.
            data={image.file}
          />
        </div>
      </div>
    );
  }
}
