import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { inputFieldValueAsNumber, preventDefault } from '../../lib/util';
import { EncodeOptions } from './encoder-meta';
import Range from '../../components/range';
import * as style from '../../components/Options/style.scss';

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
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="level"
            min="0"
            max="7"
            step="1"
            value={options.level}
            onInput={this.onChange}
          >
            Effort:
          </Range>
        </div>
      </form>
    );
  }
}
