import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import { /*inputFieldCheckedAsNumber, inputFieldValueAsNumber,*/ preventDefault } from '../../lib/util';
import { EncodeOptions } from './encoder-meta';
import * as style from '../../components/Options/style.scss';
// import Checkbox from '../../components/checkbox';
// import Expander from '../../components/expander';
// import Select from '../../components/select';
// import Range from '../../components/range';
// import linkState from 'linkstate';

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

interface State{}

export default class AVIFEncoderOptions extends Component<Props, State> {
  state: State = {
  };

  @bind
  onChange(event: Event) {
  }

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        Lol
      </form>
    );
  }
}
