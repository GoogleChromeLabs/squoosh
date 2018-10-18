import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { inputFieldValueAsNumber, konami } from '../../lib/util';
import { QuantizeOptions } from './processor-meta';
import * as style from '../../components/options/style.scss';
import Expander from '../../components/expander';
import Select from '../../components/select';

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
      zx: form.zx ? inputFieldValueAsNumber(form.zx) : this.props.options.zx,
      maxNumColors: form.maxNumColors
        ? inputFieldValueAsNumber(form.maxNumColors)
        : this.props.options.maxNumColors,
      dither: inputFieldValueAsNumber(form.dither),
    };
    this.props.onChange(options);
  }

  render({ options }: Props, { extendedSettings }: State) {
    return (
      <form class={style.optionsSection}>
        <Expander>
          {extendedSettings ?
            <label class={style.optionTextFirst}>
              Type:
              <Select
                name="zx"
                value={'' + options.zx}
                onChange={this.onChange}
              >
                <option value="0">Standard</option>
                <option value="1">ZX</option>
              </Select>
            </label>
          : null}
        </Expander>
        <Expander>
          {options.zx ? null :
            <label class={style.optionTextFirst}>
              Colors:
              <range-input
                name="maxNumColors"
                min="2"
                max="256"
                value={'' + options.maxNumColors}
                onChange={this.onChange}
              />
            </label>
          }
        </Expander>
        <label class={style.optionTextFirst}>
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
