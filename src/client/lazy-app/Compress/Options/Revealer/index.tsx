import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { Arrow } from '../../../icons';

interface Props extends preact.JSX.HTMLAttributes {}
interface State {}

export default class Revealer extends Component<Props, State> {
  render(props: Props) {
    return (
      <div class={style.checkbox}>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <input class={style.realCheckbox} type="checkbox" {...props} />
        <div class={style.arrow}>
          <Arrow />
        </div>
      </div>
    );
  }
}
