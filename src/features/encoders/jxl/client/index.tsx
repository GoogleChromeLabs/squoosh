import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { inputFieldValueAsNumber, preventDefault } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';

export const encode = (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) => workerBridge.jxlEncode(signal, imageData, options);

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

interface State {}

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
      // Copy over options the form doesn't care about, eg emulate_jpeg_size
      ...options,
      speed: inputFieldValueAsNumber(form.speed, options.speed),
      quality: inputFieldValueAsNumber(form.quality, options.quality),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="speed"
            min="1"
            max="7"
            value={options.speed}
            onInput={this.onChange}
          >
            Speed:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="0.5"
            max="8"
            step="0.1"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
      </form>
    );
  }
}
