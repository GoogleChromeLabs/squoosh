import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import {
  /*inputFieldCheckedAsNumber,*/ inputFieldValueAsNumber,
  preventDefault,
} from '../../lib/util';
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

export default class AVIFEncoderOptions extends Component<Props, State> {
  state: State = {};

  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;
    const newOptions: EncodeOptions = {
      // Copy over options the form doesn't currently care about, eg arithmetic
      ...this.props.options,
      minQuantizer: inputFieldValueAsNumber(
        form.quantizer,
        options.minQuantizer,
      ),
      maxQuantizer: inputFieldValueAsNumber(
        form.quantizer,
        options.maxQuantizer,
      ),
      speed: inputFieldValueAsNumber(form.speed, options.speed),
    };
    this.props.onChange(newOptions);
  }

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="quantizer"
            min="0"
            max="63"
            value={options.minQuantizer}
            onInput={this.onChange}
          >
            Quantizer
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="speed"
            min="0"
            max="10"
            value={options.speed}
            onInput={this.onChange}
          >
            Speed
          </Range>
        </div>
      </form>
    );
  }
}
