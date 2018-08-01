import { h, Component } from 'preact';
import { bind, inputFieldValueAsNumber } from '../../lib/util';
import { QuantizeOptions } from './quantizer';

interface Props {
  options: QuantizeOptions;
  onChange(newOptions: QuantizeOptions): void;
}

export default class QuantizerOptions extends Component<Props, {}> {
  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement;

    const options: QuantizeOptions = {
      maxNumColors: inputFieldValueAsNumber(form.maxNumColors),
      dither: inputFieldValueAsNumber(form.dither),
    };
    this.props.onChange(options);
  }

  render({ options }: Props) {
    return (
      <form>
        <label>
          Pallette Colors:
          <input
            name="maxNumColors"
            type="range"
            min="2"
            max="256"
            value={'' + options.maxNumColors}
            onChange={this.onChange}
          />
        </label>
        <label>
          Dithering:
          <input
            name="dither"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={'' + options.dither}
            onChange={this.onChange}
          />
        </label>
      </form>
    );
  }
}
