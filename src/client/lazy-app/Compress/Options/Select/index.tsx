import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';

interface Props extends preact.JSX.HTMLAttributes {
  large?: boolean;
}
interface State {}

export default class Select extends Component<Props, State> {
  render(props: Props) {
    const { large, ...otherProps } = props;

    return (
      <div class={style.select}>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <select
          class={`${style.builtinSelect} ${large ? style.large : ''}`}
          {...otherProps}
        />
        <svg class={style.arrow} viewBox="0 0 10 5">
          <path d="M0 0l5 5 5-5z" />
        </svg>
      </div>
    );
  }
}
