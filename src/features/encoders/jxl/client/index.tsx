import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';

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

interface State {
  options: EncodeOptions;
  effort: number;
  quality: number;
  progressive: boolean;
  edgePreservingFilter: number;
}

const maxSpeed = 7;

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
      effort: maxSpeed - options.speed,
      quality: options.quality,
      progressive: options.progressive,
      edgePreservingFilter: options.epf,
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
          speed: maxSpeed - optionState.effort,
          quality: optionState.quality,
          progressive: optionState.progressive,
          epf: optionState.edgePreservingFilter,
        };

        // Updating options, so we don't recalculate in getDerivedStateFromProps.
        newState.options = newOptions;

        this.setState(newState);

        this.props.onChange(newOptions);
      });
    }

    return this._inputChangeCallbacks.get(prop)!;
  };

  render(
    {}: Props,
    { effort, quality, progressive, edgePreservingFilter }: State,
  ) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            min="0"
            max="100"
            step="0.1"
            value={quality}
            onInput={this._inputChange('quality', 'number')}
          >
            Quality:
          </Range>
        </div>
        <label class={style.optionInputFirst}>
          <Checkbox
            name="progressive"
            checked={progressive}
            onChange={this._inputChange('progressive', 'boolean')}
          />
          Progressive rendering
        </label>
        <div class={style.optionOneCell}>
          <Range
            min="0"
            max="3"
            value={edgePreservingFilter}
            onInput={this._inputChange('edgePreservingFilter', 'number')}
          >
            Edge preserving filter:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            min="0"
            max={maxSpeed - 1}
            value={effort}
            onInput={this._inputChange('effort', 'number')}
          >
            Effort:
          </Range>
        </div>
      </form>
    );
  }
}
