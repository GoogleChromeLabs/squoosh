import { h, Component } from 'preact';
import * as style from './style.scss';
import { UncheckedIcon, CheckedIcon } from '../../lib/icons';

interface Props extends JSX.HTMLAttributes {}
interface State {}

export default class Checkbox extends Component<Props, State> {
  render(props: Props) {
    return (
      <div class={style.checkbox}>
        {props.checked
          ? <CheckedIcon class={`${style.icon} ${style.checked}`} />
          : <UncheckedIcon class={style.icon} />
        }
        <input class={style.realCheckbox} type="checkbox" {...props}/>
      </div>
    );
  }
}
