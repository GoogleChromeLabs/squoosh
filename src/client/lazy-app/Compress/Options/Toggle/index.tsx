import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';

interface Props extends preact.JSX.HTMLAttributes {}
interface State {}

export default class Toggle extends Component<Props, State> {
  render(props: Props) {
    return (
      <div class={style.checkbox}>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <input class={style.realCheckbox} type="checkbox" {...props} />
        <div class={style.track}>
          <div class={style.thumbTrack}>
            <div class={style.thumb}></div>
          </div>
        </div>
      </div>
    );
  }
}
