import { h, Component } from 'preact';
import { bind, inputFieldValueAsNumber } from '../../lib/util';
import { QuantizeOptions } from './quantizer';
import * as styles from './styles.scss';

interface Props {
  options: QuantizeOptions;
  onChange(newOptions: QuantizeOptions): void;
}

export default class QuantizerOptions extends Component<Props, {}> {
  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement;

    const options: QuantizeOptions = {
      zx: inputFieldValueAsNumber(form.zx),
      maxNumColors: inputFieldValueAsNumber(form.maxNumColors),
      dither: inputFieldValueAsNumber(form.dither),
    };
    this.props.onChange(options);
  }

  render({ options }: Props) {
    return (
      <form>
        <label>
          Type:
          <select
            name="zx"
            value={'' + options.zx}
            onChange={this.onChange}
          >
            <option value="0">Standard</option>
            <option value="1">ZX</option>
          </select>
        </label>
        <label style={options.zx ? 'display: none' : ''}>
          Palette Colors:
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
