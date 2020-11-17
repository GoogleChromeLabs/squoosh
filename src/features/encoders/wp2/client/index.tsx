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
) => workerBridge.wp2Encode(signal, imageData, options);

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

  private onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;
    const newOptions: EncodeOptions = {
      quality: inputFieldValueAsNumber(form.quality, options.quality),
      alpha_quality: inputFieldValueAsNumber(
        form.alpha_quality,
        options.alpha_quality,
      ),
      speed: inputFieldValueAsNumber(form.speed, options.speed),
      pass: inputFieldValueAsNumber(form.pass, options.pass),
      sns: inputFieldValueAsNumber(form.sns, options.sns),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="0"
            max="100"
            step="1"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="alpha_quality"
            min="0"
            max="100"
            step="1"
            value={options.alpha_quality}
            onInput={this.onChange}
          >
            Alpha Quality:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="speed"
            min="0"
            max="9"
            step="1"
            value={options.speed}
            onInput={this.onChange}
          >
            Speed:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="pass"
            min="1"
            max="10"
            step="1"
            value={options.pass}
            onInput={this.onChange}
          >
            Pass:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="sns"
            min="0"
            max="100"
            step="1"
            value={options.sns}
            onInput={this.onChange}
          >
            Spatial noise shaping:
          </Range>
        </div>
      </form>
    );
  }
}
