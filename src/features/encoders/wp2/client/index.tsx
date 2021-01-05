import { EncodeOptions, UVMode, Csp } from '../shared/meta';
import { defaultOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Select from 'client/lazy-app/Compress/Options/Select';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import linkState from 'linkstate';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';
import { TileShape } from 'codecs/wp2/enc/wp2_enc';

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
  colorSpace: number;
  errorDiffusion: number;
  showAdvanced: boolean;
  separateAlpha: boolean;
  tileShape: number;
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
      effort: options.effort,
      alphaQuality: options.alpha_quality,
      passes: options.pass,
      sns: options.sns,
      uvMode: options.uv_mode,
      colorSpace: options.csp_type,
      errorDiffusion: options.error_diffusion,
      separateAlpha: options.quality !== options.alpha_quality,
      tileShape: options.tile_shape,
    };

    // If quality is > 95, it's lossless with slight loss
    if (options.quality > 95) {
      modifyState.lossless = true;
      modifyState.slightLoss = 100 - options.quality;
    } else {
      modifyState.quality = options.quality;
      modifyState.lossless = false;
    }

    return modifyState;
  }

  // Other state is set in getDerivedStateFromProps
  state: State = {
    lossless: false,
    slightLoss: 0,
    quality: defaultOptions.quality,
    showAdvanced: false,
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
          effort: optionState.effort,
          quality: optionState.lossless
            ? 100 - optionState.slightLoss
            : optionState.quality,
          alpha_quality: optionState.separateAlpha
            ? optionState.alphaQuality
            : optionState.quality,
          pass: optionState.passes,
          sns: optionState.sns,
          uv_mode: optionState.uvMode,
          csp_type: optionState.colorSpace,
          error_diffusion: optionState.errorDiffusion,
          tile_shape: optionState.tileShape,
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
      colorSpace,
      errorDiffusion,
      separateAlpha,
      showAdvanced,
      tileShape,
    }: State,
  ) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionToggle}>
          Lossless
          <Checkbox
            checked={lossless}
            onChange={this._inputChange('lossless', 'boolean')}
          />
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
              <label class={style.optionToggle}>
                Separate alpha quality
                <Checkbox
                  checked={separateAlpha}
                  onChange={this._inputChange('separateAlpha', 'boolean')}
                />
              </label>
              <Expander>
                {separateAlpha && (
                  <div class={style.optionOneCell}>
                    <Range
                      min="0"
                      max="100"
                      step="1"
                      value={alphaQuality}
                      onInput={this._inputChange('alphaQuality', 'number')}
                    >
                      Alpha Quality:
                    </Range>
                  </div>
                )}
              </Expander>
            </div>
          )}
        </Expander>
        <label class={style.optionReveal}>
          <Revealer
            checked={showAdvanced}
            onChange={linkState(this, 'showAdvanced')}
          />
          Advanced settings
        </label>
        <Expander>
          {showAdvanced && (
            <div>
              <Expander>
                {!lossless && (
                  <div>
                    {/*<div class={style.optionOneCell}>
                      <Range
                        min="1"
                        max="10"
                        step="1"
                        value={passes}
                        onInput={this._inputChange('passes', 'number')}
                      >
                        Passes:
                      </Range>
                    </div>*/}
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
                        <option value={UVMode.UVModeAdapt}>Mixed</option>
                        <option value={UVMode.UVMode420}>Half</option>
                        <option value={UVMode.UVMode444}>Off</option>
                      </Select>
                    </label>
                    <label class={style.optionTextFirst}>
                      Color space:
                      <Select
                        value={colorSpace}
                        onInput={this._inputChange('colorSpace', 'number')}
                      >
                        <option value={Csp.kYCoCg}>YCoCg</option>
                        <option value={Csp.kYCbCr}>YCbCr</option>
                        <option value={Csp.kCustom}>Adaptive</option>
                        <option value={Csp.kYIQ}>YIQ</option>
                      </Select>
                    </label>
                    <div class={style.optionOneCell}>
                      <Range
                        min="0"
                        max="100"
                        step="1"
                        value={errorDiffusion}
                        onInput={this._inputChange('errorDiffusion', 'number')}
                      >
                        Error diffusion:
                      </Range>
                    </div>
                  </div>
                )}
              </Expander>
              <label class={style.optionTextFirst}>
                Tile shape:
                <Select
                  value={tileShape}
                  onInput={this._inputChange('tileShape', 'number')}
                >
                  <option value={TileShape.Auto}>Auto</option>
                  <option value={TileShape.Square128}>128x128</option>
                  <option value={TileShape.Square256}>256x256</option>
                  <option value={TileShape.Square512}>512x512</option>
                  <option value={TileShape.Wide}>Maximum</option>
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
