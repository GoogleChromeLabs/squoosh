import { h, Component } from 'preact';
import * as style from './style.scss';
import RangeInputElement from '../../custom-els/RangeInput';

import { linkRef, bind } from '../../lib/initial-util';

import '../../custom-els/RangeInput'; // eslint-disable import/no-duplicates

interface Props extends JSX.HTMLAttributes {}
interface State {}

export default class Range extends Component<Props, State> {
  rangeWc?: RangeInputElement;

  @bind
  private onTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    this.rangeWc!.value = input.value;
    const { onInput } = this.props;
    if (onInput) onInput(event);
  }

  render(props: Props) {
    const {
      children,
      ...otherProps
    } = props;

    const {
      value, min, max, step,
    } = props;

    return (
      <label className={style.range}>
        <span className={style.labelText}>{children}</span>
        {/* On interaction, Safari gives focus to the first element in the label, so the
        <range-input> is deliberately first. */}
        <div className={style.rangeWcContainer}>
          <range-input
            ref={linkRef(this, 'rangeWc')}
            class={style.rangeWc}
            {...otherProps}
          />
        </div>
        <input
          type="number"
          className={style.textInput}
          value={value}
          min={min}
          max={max}
          step={step}
          onInput={this.onTextInput}
        />
      </label>
    );
  }
}
