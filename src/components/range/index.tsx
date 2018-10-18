import { h, Component } from 'preact';
import * as style from './style.scss';
import RangeInputElement from '../../custom-els/RangeInput';
import '../../custom-els/RangeInput';
import { linkRef } from '../../lib/initial-util';

interface Props extends JSX.HTMLAttributes {}
interface State {}

export default class Range extends Component<Props, State> {
  rangeWc?: RangeInputElement;

  render(props: Props) {
    const {
      children,
      ...otherProps
    } = props;

    const {
      value, min, max, onInput,
    } = props;

    return (
      <label class={style.range}>
        <span class={style.labelText}>{children}</span>
        <input
          type="number"
          class={style.textInput}
          value={value}
          min={min}
          max={max}
          onInput={onInput}
        />
        <div class={style.rangeWcContainer}>
          <range-input
            ref={linkRef(this, 'rangeWc')}
            class={style.rangeWc}
            {...otherProps}
          />
        </div>
      </label>
    );
  }
}
