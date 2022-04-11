import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { UncheckedIcon, CheckedIcon } from '../../../icons';

interface Props extends preact.JSX.HTMLAttributes {}
interface State {}

export default class Checkbox extends Component<Props, State> {
  render(props: Props) {
    return (
      <div class={style.checkbox}>
        {props.checked ? (
          props.disabled ? (
            <CheckedIcon class={`${style.icon} ${style.disabled}`} />
          ) : (
            <CheckedIcon class={`${style.icon} ${style.checked}`} />
          )
        ) : (
          <UncheckedIcon class={style.icon} />
        )}
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <input class={style.realCheckbox} type="checkbox" {...props} />
      </div>
    );
  }
}
