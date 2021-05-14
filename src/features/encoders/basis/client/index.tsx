import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import {
  inputFieldChecked,
  inputFieldValueAsNumber,
  preventDefault,
} from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import linkState from 'linkstate';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Select from 'client/lazy-app/Compress/Options/Select';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';

export function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) {
  return workerBridge.basisEncode(signal, imageData, options);
}

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

interface State {
  showAdvanced: boolean;
}

export class Options extends Component<Props, State> {
  state: State = {
    showAdvanced: false,
  };

  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;

    const newOptions: EncodeOptions = {
      // Copy over options the form doesn't currently care about, eg arithmetic
      ...this.props.options,
      // .value
      quality: inputFieldValueAsNumber(form.quality, options.quality),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props, { showAdvanced }: State) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="0"
            max="4"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
        <label class={style.optionReveal}>
          <Revealer
            checked={showAdvanced}
            onChange={linkState(this, 'showAdvanced')}
          />
          Advanced settings
        </label>
        <Expander>{showAdvanced ? <div>Nothing here yet</div> : null}</Expander>
      </form>
    );
  }
}
