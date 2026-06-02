import { h, Component } from 'preact';
import { Options as SetBackgroundOptions } from '../shared/meta';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import { preventDefault, inputFieldValue } from 'client/lazy-app/util';

interface Props {
  options: SetBackgroundOptions;
  onChange(newOptions: SetBackgroundOptions): void;
}

export class Options extends Component<Props, {}> {
  setColorInput = (input: HTMLInputElement | null) => {
    if (input) input.setAttribute('alpha', '');
  };

  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;

    this.props.onChange({
      background: inputFieldValue(
        form.background,
        this.props.options.background,
      ),
    });
  };

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          Background:
          <input
            class={style.textField}
            name="background"
            type="color"
            ref={this.setColorInput}
            value={options.background}
            onInput={this.onChange}
          />
        </label>
      </form>
    );
  }
}
