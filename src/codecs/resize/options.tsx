import { h, Component } from 'preact';
import linkState from 'linkstate';
import { bind, linkRef } from '../../lib/initial-util';
import { inputFieldValueAsNumber } from '../../lib/util';
import { ResizeOptions } from './processor-meta';
import * as style from '../../components/options/style.scss';
import Checkbox from '../../components/checkbox';
import Expander from '../../components/expander';
import Select from '../../components/select';

interface Props {
  isVector: Boolean;
  options: ResizeOptions;
  aspect: number;
  onChange(newOptions: ResizeOptions): void;
}

interface State {
  maintainAspect: boolean;
}

export default class ResizerOptions extends Component<Props, State> {
  state: State = {
    maintainAspect: true,
  };

  form?: HTMLFormElement;

  reportOptions() {
    const width = this.form!.width as HTMLInputElement;
    const height = this.form!.height as HTMLInputElement;

    if (!width.checkValidity() || !height.checkValidity()) return;

    const options: ResizeOptions = {
      width: inputFieldValueAsNumber(width),
      height: inputFieldValueAsNumber(height),
      method: this.form!.resizeMethod.value,
      fitMethod: this.form!.fitMethod ? this.form!.fitMethod.value : this.props.options.fitMethod,
    };
    this.props.onChange(options);
  }

  @bind
  onChange(event: Event) {
    this.reportOptions();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (!prevState.maintainAspect && this.state.maintainAspect) {
      this.form!.height.value = Math.round(Number(this.form!.width.value) / this.props.aspect);
      this.reportOptions();
    }
  }

  @bind
  onWidthInput(event: Event) {
    if (!this.state.maintainAspect) return;

    const width = inputFieldValueAsNumber(this.form!.width);
    this.form!.height.value = Math.round(width / this.props.aspect);
  }

  @bind
  onHeightInput(event: Event) {
    if (!this.state.maintainAspect) return;

    const height = inputFieldValueAsNumber(this.form!.height);
    this.form!.width.value = Math.round(height * this.props.aspect);
  }

  render({ options, isVector }: Props, { maintainAspect }: State) {
    return (
      <form ref={linkRef(this, 'form')} class={style.optionsSection}>
        <label class={style.optionTextFirst}>
          Method:
          <Select
            name="resizeMethod"
            value={options.method}
            onChange={this.onChange}
          >
            {isVector && <option value="vector">Vector</option>}
            <option value="browser-pixelated">Browser pixelated</option>
            <option value="browser-low">Browser low quality</option>
            <option value="browser-medium">Browser medium quality</option>
            <option value="browser-high">Browser high quality</option>
          </Select>
        </label>
        <label class={style.optionTextFirst}>
          Width:
          <input
            required
            class={style.textField}
            name="width"
            type="number"
            min="1"
            value={'' + options.width}
            onChange={this.onChange}
            onInput={this.onWidthInput}
          />
        </label>
        <label class={style.optionTextFirst}>
          Height:
          <input
            required
            class={style.textField}
            name="height"
            type="number"
            min="1"
            value={'' + options.height}
            onChange={this.onChange}
          />
        </label>
        <label class={style.optionInputFirst}>
          <Checkbox
            name="maintainAspect"
            checked={maintainAspect}
            onChange={linkState(this, 'maintainAspect')}
          />
          Maintain aspect ratio
        </label>
        <Expander>
          {maintainAspect ? null :
            <label class={style.optionTextFirst}>
              Fit method:
              <Select
                name="fitMethod"
                value={options.fitMethod}
                onChange={this.onChange}
              >
                <option value="stretch">Stretch</option>
                <option value="cover">Cover</option>
              </Select>
            </label>
          }
        </Expander>
      </form>
    );
  }
}
