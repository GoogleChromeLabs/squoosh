import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import {
  inputFieldValueAsNumber,
  preventDefault,
  shallowEqual,
} from 'client/lazy-app/util';
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
  options: EncodeOptions;
  effort: number;
  quality: number;
  alphaQuality: number;
  passes: number;
  sns: number;
  uvMode: number;
}

export class Options extends Component<Props, State> {
  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    if (state.options && shallowEqual(state.options, props.options)) {
      return null;
    }

    const { options } = props;

    // Create default form state from options
    return {
      options,
      effort: options.speed,
      quality: options.quality,
      alphaQuality: options.alpha_quality,
      passes: options.pass,
      sns: options.sns,
      uvMode: options.uv_mode,
    };
  }

  private _inputChangeCallbacks = new Map<string, (event: Event) => void>();

  private _inputChange = (prop: keyof State, type: 'number' | 'boolean') => {
    // Cache the callback for performance
    if (!this._inputChangeCallbacks.has(prop)) {
      this._inputChangeCallbacks.set(prop, (event: Event) => {
        const formEl = event.target as HTMLInputElement | HTMLSelectElement;
        const newVal =
          type === 'boolean'
            ? 'checked' in formEl
              ? formEl.checked
              : !!formEl.value
            : Number(formEl.value);

        const newState: Partial<State> = {
          [prop]: newVal,
        };

        const optionState = {
          ...this.state,
          ...newState,
        };

        const newOptions: EncodeOptions = {
          speed: optionState.effort,
          quality: optionState.quality,
          alpha_quality: optionState.alphaQuality,
          pass: optionState.passes,
          sns: optionState.sns,
          uv_mode: optionState.uvMode,
        };

        // Updating options, so we don't recalculate in getDerivedStateFromProps.
        newState.options = newOptions;

        this.setState(newState);

        this.props.onChange(newOptions);
      });
    }

    return this._inputChangeCallbacks.get(prop)!;
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
