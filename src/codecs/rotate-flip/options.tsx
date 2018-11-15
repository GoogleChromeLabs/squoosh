import { h, Component } from 'preact';
import { bind, linkRef } from '../../lib/initial-util';
import { inputFieldValueAsNumber, inputFieldChecked } from '../../lib/util';
import { RotateFlipOptions } from './processor-meta';
import * as style from '../../components/Options/style.scss';
import Checkbox from '../../components/checkbox';
import Range from '../../components/range';

interface Props {
  options: RotateFlipOptions;
  onChange(newOptions: RotateFlipOptions): void;
}

interface State {}

export default class RotateFlipOptionsForm extends Component<Props, State> {
  form?: HTMLFormElement;

  private reportOptions() {
    const form = this.form!;
    const { options } = this.props;

    const newOptions: RotateFlipOptions = {
      rotate: inputFieldValueAsNumber(form.rotate, options.rotate) as RotateFlipOptions['rotate'],
      flipHorizontal: inputFieldChecked(form.flipHorizontal, options.flipHorizontal),
      flipVertical: inputFieldChecked(form.flipVertical, options.flipVertical),
    };
    this.props.onChange(newOptions);
  }

  @bind
  private onChange() {
    this.reportOptions();
  }

  render({ options }: Props) {
    return (
      <form ref={linkRef(this, 'form')} class={style.optionsSection}>
        <div class={style.optionOneCell}>
          <Range
            name="rotate"
            min="0"
            max="270"
            step="90"
            value={'' + options.rotate}
            onInput={this.onChange}
          >
            Rotate:
          </Range>
        </div>
        <label class={style.optionInputFirst}>
          <Checkbox
            name="flipHorizontal"
            checked={options.flipHorizontal}
            onChange={this.onChange}
          />
          Flip horizontal
        </label>
        <label class={style.optionInputFirst}>
          <Checkbox
            name="flipVertical"
            checked={options.flipVertical}
            onChange={this.onChange}
          />
          Flip vertical
        </label>
      </form>
    );
  }
}
