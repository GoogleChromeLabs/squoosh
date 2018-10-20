import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { inputFieldValueAsNumber, konami } from '../../lib/util';
import { QuantizeOptions } from './quantizer';

const konamiPromise = konami();

interface Props {
  options: QuantizeOptions;
  onChange(newOptions: QuantizeOptions): void;
}

interface State {
  extendedSettings: boolean;
}

export default class QuantizerOptions extends Component<Props, State> {
  state: State = { extendedSettings: false };

  componentDidMount() {
    konamiPromise.then(() => {
      this.setState({ extendedSettings: true });
    });
  }

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

  render({ options }: Props, { extendedSettings }: State) {
    return (
      <form>
        <label style={{ display: extendedSettings ? '' : 'none' }}>
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
        <label style={{ display: options.zx ? 'none' : '' }}>
          Palette Colors:
          <range-input
            name="maxNumColors"
            min="2"
            max="256"
            value={'' + options.maxNumColors}
            onChange={this.onChange}
          />
        </label>
        <label>
          Dithering:
          <range-input
            name="dither"
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
