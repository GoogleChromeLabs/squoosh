import { h, Component } from 'preact';
import {
  Options as QuantizeOptions,
  QuantizeMode,
  defaultOptions,
} from '../shared/meta';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import {
  inputFieldValue,
  inputFieldValueAsNumber,
  konami,
  preventDefault,
} from 'client/lazy-app/util';
import linkState from 'linkstate';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Select from 'client/lazy-app/Compress/Options/Select';
import Range from 'client/lazy-app/Compress/Options/Range';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';

const konamiPromise = konami();

interface Props {
  options: QuantizeOptions;
  onChange(newOptions: QuantizeOptions): void;
}

interface State {
  extendedSettings: boolean;
  showAdvanced: boolean;
}

export class Options extends Component<Props, State> {
  state: State = { extendedSettings: false, showAdvanced: false };

  componentDidMount() {
    konamiPromise.then(() => {
      this.setState({ extendedSettings: true });
    });
  }

  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;
    const { mode = defaultOptions.mode, effort = defaultOptions.effort } =
      options;

    const newOptions: QuantizeOptions = {
      // Casting, as the formfield only returns the correct values.
      mode: inputFieldValue(form.mode, mode) as QuantizeMode,
      maxNumColors: inputFieldValueAsNumber(
        form.maxNumColors,
        options.maxNumColors,
      ),
      dither: inputFieldValueAsNumber(form.dither, options.dither),
      // Absent while the advanced settings are collapsed.
      effort: inputFieldValueAsNumber(form.effort, effort),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props, { extendedSettings, showAdvanced }: State) {
    // Settings persisted before these options existed won't have them.
    const { mode = defaultOptions.mode, effort = defaultOptions.effort } =
      options;

    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          {extendedSettings ? 'Mode:' : 'Channels:'}
          <Select name="mode" value={mode} onChange={this.onChange}>
            <option value="rgba">All</option>
            <option value="alphaOnly">Alpha only</option>
            {extendedSettings && <option value="zx">ZX</option>}
          </Select>
        </label>
        <Expander>
          {mode === 'zx' ? null : (
            <div class={style.optionOneCell}>
              <Range
                name="maxNumColors"
                min="2"
                max="256"
                value={options.maxNumColors}
                onInput={this.onChange}
              >
                {/* In alpha-only mode the palette is a set of alpha values. */}
                {mode === 'alphaOnly' ? 'Alpha levels:' : 'Colors:'}
              </Range>
            </div>
          )}
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
        <div class={style.optionOneCell}>
          <Range
            name="effort"
            min="1"
            max="10"
            value={effort}
            onInput={this.onChange}
          >
            Effort:
          </Range>
        </div>
      </form>
    );
  }
}
