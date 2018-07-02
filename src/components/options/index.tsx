import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';
import BrowserJPEGEncoderOptions from '../../codecs/browser-jpeg/options';
import BrowserWebPEncoderOptions from '../../codecs/browser-webp/options';

import * as mozJPEG from '../../codecs/mozjpeg/encoder';
import * as identity from '../../codecs/identity/encoder';
import * as browserPNG from '../../codecs/browser-png/encoder';
import * as browserJPEG from '../../codecs/browser-jpeg/encoder';
import * as browserWebP from '../../codecs/browser-webp/encoder';
import {
    EncoderState,
    EncoderType,
    EncoderOptions,
    encoders,
    encodersSupported,
    EncoderSupportMap,
} from '../../codecs/encoders';

const encoderOptionsComponentMap = {
  [mozJPEG.type]: MozJpegEncoderOptions,
  [identity.type]: undefined,
  [browserPNG.type]: undefined,
  [browserJPEG.type]: BrowserJPEGEncoderOptions,
  [browserWebP.type]: BrowserWebPEncoderOptions,
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
