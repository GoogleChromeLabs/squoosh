import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { inputFieldValueAsNumber, konami, preventDefault } from '../../lib/util';
import { QuantizeOptions } from './processor-meta';
import * as style from '../../components/Options/style.scss';
import Expander from '../../components/expander';
import Select from '../../components/select';
import Range from '../../components/range';

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
    const { options } = this.props;

    const newOptions: QuantizeOptions = {
      zx: inputFieldValueAsNumber(form.zx, options.zx),
      maxNumColors: inputFieldValueAsNumber(form.maxNumColors, options.maxNumColors),
      dither: inputFieldValueAsNumber(form.dither),
    };
    this.props.onChange(newOptions);
  }

  render({ options }: Props, { extendedSettings }: State) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
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
            <div class={style.optionOneCell}>
              <Range
                name="maxNumColors"
                min="2"
                max="256"
                value={options.maxNumColors}
                onInput={this.onChange}
              >
                Colors:
              </Range>
            </div>
          }
        </Expander>
        <div class={style.optionOneCell}>
          <Range
            name="dither"
            min="0"
            max="1"
            step="0.01"
            value={options.dither}
            onInput={this.onChange}
          >
            Dithering:
          </Range>
        </div>
      </form>
    );
  }
}
