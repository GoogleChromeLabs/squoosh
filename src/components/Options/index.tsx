import { h, Component } from 'preact';
import './style.scss';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';
import BrowserJPEGEncoderOptions from '../../codecs/browser-jpeg/options';
import WebPEncoderOptions from '../../codecs/webp/options';
import BrowserWebPEncoderOptions from '../../codecs/browser-webp/options';

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
  onTypeChange(newType: EncoderType): void;
  onOptionsChange(newOptions: EncoderOptions): void;
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
  onTypeChange(event: Event) {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as EncoderType;
    this.props.onTypeChange(type);
  }

  render({ class: className, encoderState, onOptionsChange }: Props, { encoderSupportMap }: State) {
    // tslint:disable variable-name
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={`${style.options}${className ? (' ' + className) : ''}`}>
        <label>
          Mode:
          {encoderSupportMap ?
            <select value={encoderState.type} onChange={this.onTypeChange}>
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
            onChange={onOptionsChange}
          />
        }
      </div>
    );
  }
}
