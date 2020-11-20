import { EncodeOptions, UVMode } from '../shared/meta';
import { defaultOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component, Fragment } from 'preact';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Select from 'client/lazy-app/Compress/Options/Select';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';

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
  lossless: boolean;
  slightLoss: number;
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

    const modifyState: Partial<State> = {
      options,
      effort: options.speed,
      alphaQuality: options.alpha_quality,
      passes: options.pass,
      sns: options.sns,
      uvMode: options.uv_mode,
    };

    // If quality is > 95, it's lossless with slight loss
    if (options.quality <= 95) {
      modifyState.quality = options.quality;
      modifyState.lossless = false;
    } else {
      modifyState.lossless = true;
      modifyState.slightLoss = 100 - options.quality;
    }

    return modifyState;
  }

  // Other state is set in getDerivedStateFromProps
  state: State = {
    lossless: false,
    slightLoss: 0,
    quality: defaultOptions.quality,
  } as State;

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
          quality: optionState.lossless
            ? 100 - optionState.slightLoss
            : optionState.quality,
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

  render(
    {}: Props,
    {
      effort,
      alphaQuality,
      passes,
      quality,
      sns,
      uvMode,
      lossless,
      slightLoss,
    }: State,
  ) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionInputFirst}>
          <Checkbox
            name="lossless"
            checked={lossless}
            onChange={this._inputChange('lossless', 'boolean')}
          />
          Lossless
        </label>
        <Expander>
          {lossless && (
            <div class={style.optionOneCell}>
              <Range
                min="0"
                max="5"
                step="0.1"
                value={slightLoss}
                onInput={this._inputChange('slightLoss', 'number')}
              >
                Slight loss:
              </Range>
            </div>
          )}
        </Expander>
        <Expander>
          {!lossless && (
            <div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="95"
                  step="0.1"
                  value={quality}
                  onInput={this._inputChange('quality', 'number')}
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
                  value={alphaQuality}
                  onInput={this._inputChange('alphaQuality', 'number')}
                >
                  Alpha Quality:
                </Range>
              </div>
              <div class={style.optionOneCell}>
                <Range
                  name="pass"
                  min="1"
                  max="10"
                  step="1"
                  value={passes}
                  onInput={this._inputChange('passes', 'number')}
                >
                  Passes:
                </Range>
              </div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="100"
                  step="1"
                  value={sns}
                  onInput={this._inputChange('sns', 'number')}
                >
                  Spatial noise shaping:
                </Range>
              </div>
              <label class={style.optionTextFirst}>
                Subsample chroma:
                <Select
                  value={uvMode}
                  onInput={this._inputChange('uvMode', 'number')}
                >
                  <option value={UVMode.UVModeAuto}>Auto</option>
                  <option value={UVMode.UVModeAdapt}>Vary</option>
                  <option value={UVMode.UVMode420}>Half</option>
                  <option value={UVMode.UVMode444}>Off</option>
                </Select>
              </label>
            </div>
          )}
        </Expander>
        <div class={style.optionOneCell}>
          <Range
            min="0"
            max="9"
            step="1"
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
