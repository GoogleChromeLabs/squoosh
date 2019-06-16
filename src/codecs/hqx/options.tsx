import { h, Component } from 'preact';
import { bind, linkRef } from '../../lib/initial-util';
import {
  inputFieldValueAsNumber, preventDefault,
} from '../../lib/util';
import { HqxOptions } from './processor-meta';
import * as style from '../../components/Options/style.scss';
import Select from '../../components/select';

interface Props {
  options: HqxOptions;
  onChange(newOptions: HqxOptions): void;
}

interface State{}

export default class HqxerOptions extends Component<Props, State> {
  state: State = {};

  form?: HTMLFormElement;

  private reportOptions() {
    const form = this.form!;
    const factor = form.factor as HTMLInputElement;

    if (!factor.checkValidity()) return;

    const newOptions: HqxOptions = {
      factor: inputFieldValueAsNumber(factor) as HqxOptions['factor'],
    };
    this.props.onChange(newOptions);
  }

  @bind
  private onChange() {
    this.reportOptions();
  }

  render({ options }: Props, { }: State) {
    return (
      <form ref={linkRef(this, 'form')} class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          Factor:
          <Select
            name="factor"
            value={options.factor}
            onChange={this.onChange}
          >
            <option value="2">HQ2X</option>
            <option value="3">HQ3X</option>
            <option value="4">HQ4X</option>
          </Select>
        </label>
      </form>
    );
  }
}
