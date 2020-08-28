import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { inputFieldValueAsNumber, preventDefault } from '../../lib/util';
import { EncodeOptions } from './encoder-meta';
import * as style from '../../components/Options/style.scss';
// import Checkbox from '../../components/checkbox';
// import Expander from '../../components/expander';
// import Select from '../../components/select';
import Range from '../../components/range';
// import linkState from 'linkstate';

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

interface State {}

export default class JXLEncoderOptions extends Component<Props, State> {
  state: State = {};

  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;

    const newOptions: EncodeOptions = {
      // Copy over options the form doesn't care about, eg emulate_jpeg_size
      ...options,
      speed: inputFieldValueAsNumber(form.speed, options.speed),
      quality: inputFieldValueAsNumber(form.quality, options.quality),
    };
    this.props.onChange(newOptions);
  }

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="speed"
            min="1"
            max="7"
            value={options.speed}
            onInput={this.onChange}
          >
            Speed:
          </Range>
          <Range
            name="quality"
            min="0.5"
            max="8"
            step="0.1"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
      </form>
    );
  }
}
