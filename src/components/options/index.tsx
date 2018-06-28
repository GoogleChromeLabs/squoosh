import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';

import { type as mozJPEGType } from '../../codecs/mozjpeg/encoder';
import { type as identityType } from '../../codecs/identity/encoder';
import { EncoderState, EncoderType, EncoderOptions, encoders } from '../../codecs/encoders';

const encoderOptionsComponentMap = {
  [mozJPEGType]: MozJpegEncoderOptions,
  [identityType]: undefined
};

interface Props {
  class?: string;
  encoderState: EncoderState;
  onTypeChange(newType: EncoderType): void;
  onOptionsChange(newOptions: EncoderOptions): void;
}

interface State {}

export default class Options extends Component<Props, State> {
  typeSelect?: HTMLSelectElement;

  @bind
  onTypeChange(event: Event) {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as EncoderType;
    this.props.onTypeChange(type);
  }

  render({ class: className, encoderState, onOptionsChange }: Props) {
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={`${style.options}${className ? (' ' + className) : ''}`}>
        <label>
          Mode:
          <select value={encoderState.type} onChange={this.onTypeChange}>
            {encoders.map(encoder => (
              <option value={encoder.type}>{encoder.label}</option>
            ))}
          </select>
        </label>
        {EncoderOptionComponent &&
          <EncoderOptionComponent
            options={
              // Casting options, as encoderOptionsComponentMap[encodeData.type] ensures the correct type,
              // but typescript isn't smart enough.
              encoderState.options as typeof EncoderOptionComponent['prototype']['props']['options']
            }
            onChange={onOptionsChange}
          />
        }
      </div>
    );
  }
}
