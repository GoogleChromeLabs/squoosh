import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';
import BrowserJPEGEncoderOptions from '../../codecs/browser-jpeg/options';
import WebPEncoderOptions from '../../codecs/webp/options';
import BrowserWebPEncoderOptions from '../../codecs/browser-webp/options';

import QuantizerOptions from '../../codecs/imagequant/options';

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
    PreprocessorState,
} from '../../codecs/encoders';

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

    const preprocessorState = this.props.preprocessorState;
    const preprocessor = el.name.split('.')[0] as keyof typeof preprocessorState;
    preprocessorState[preprocessor].enabled = el.checked;
    this.props.onPreprocessorOptionsChange(preprocessorState);
  }

  render(
    { class: className, encoderState, preprocessorState, onEncoderOptionsChange }: Props,
    { encoderSupportMap }: State,
  ) {
    // tslint:disable variable-name
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={`${style.options}${className ? (' ' + className) : ''}`}>
        <p>Quantization</p>
        <label>
          <input
            name="quantizer.enable"
            type="checkbox"
            checked={!!preprocessorState.quantizer.enabled}
            onChange={this.onPreprocessorEnabledChange}
          />
          Enable
        </label>
        {preprocessorState.quantizer.enabled ? (
          <QuantizerOptions
            options={preprocessorState.quantizer}
            // tslint:disable-next-line:jsx-no-lambda
            onChange={quantizeOpts => this.props.onPreprocessorOptionsChange({
              ...preprocessorState,
              quantizer: {
                ...quantizeOpts,
                enabled: preprocessorState.quantizer.enabled,
              },
            })}
          />
        ) : (
          <div/>
        )}
        <hr/>
        <label>
          Mode:
          {encoderSupportMap ?
            <select value={encoderState.type} onChange={this.onEncoderTypeChange}>
              {encoders.filter(encoder => encoderSupportMap[encoder.type]).map(encoder => (
                <option value={encoder.type}>{encoder.label}</option>
              ))}
            </select>
            :
            <select><option>Loading…</option></select>
          }
        </label>
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
      </div>
    );
  }
}
