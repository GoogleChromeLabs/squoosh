import { h, Component } from 'preact';
import { bind, inputFieldValueAsNumber } from '../../lib/util';
import { EncodeOptions } from './encoder';

type Props = {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
};

export default class OptiPNGEncoderOptions extends Component<Props, {}> {
  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement;

    const options: EncodeOptions = {
      level: inputFieldValueAsNumber(form.level),
    };
    this.props.onChange(options);
  }

  render({ options }: Props) {
    return (
      <form>
        <label>
          Level:
          <input
            name="level"
            type="range"
            min="0"
            max="7"
            step="1"
            value={'' + options.level}
            onChange={this.onChange}
          />
        </label>
      </form>
    );
  }
}
