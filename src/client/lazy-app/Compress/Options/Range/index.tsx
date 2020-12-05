import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import RangeInputElement from './custom-els/RangeInput';
import './custom-els/RangeInput';
import { linkRef } from 'shared/prerendered-app/util';

interface Props extends preact.JSX.HTMLAttributes {}
interface State {}

export default class Range extends Component<Props, State> {
  rangeWc?: RangeInputElement;

  private onTextInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    this.rangeWc!.value = input.value;
    this.rangeWc!.dispatchEvent(
      new InputEvent('input', {
        bubbles: event.bubbles,
      }),
    );
  };

  render(props: Props) {
    const { children, ...otherProps } = props;

    const { value, min, max, step } = props;

    return (
      <label class={style.range}>
        <span class={style.labelText}>{children}</span>
        {/* On interaction, Safari gives focus to the first element in the label, so the
        <range-input> is deliberately first. */}
        <div class={style.rangeWcContainer}>
          <range-input
            ref={linkRef(this, 'rangeWc')}
            class={style.rangeWc}
            {...otherProps}
          />
        </div>
        <input
          type="number"
          class={style.textInput}
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
