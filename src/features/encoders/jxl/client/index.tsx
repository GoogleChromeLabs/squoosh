import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import linkState from 'linkstate';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';

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
  quality: number;
  showAdvanced: boolean;
  separateAlpha: boolean;
  alphaQuality: number;
  lossless: boolean;
  effort: number;
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

    // qualityAlpha of -1 means "same as quality"; otherwise it's a separate
    // alpha quality.
    const separateAlpha = options.qualityAlpha !== -1;

    // Create default form state from options
    return {
      options,
      quality: options.quality,
      separateAlpha,
      alphaQuality: separateAlpha ? options.qualityAlpha : options.quality,
      lossless: options.lossless,
      effort: options.effort,
    };
  }

  // The rest of the defaults are set in getDerivedStateFromProps
  state: State = {
    lossless: false,
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
          quality: optionState.quality,
          qualityAlpha:
            optionState.lossless || !optionState.separateAlpha
              ? -1 // Use the same quality as the colour channels.
              : optionState.alphaQuality,
          lossless: optionState.lossless,
          effort: optionState.effort,
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
      quality,
      showAdvanced,
      separateAlpha,
      alphaQuality,
      lossless,
      effort,
    }: State,
  ) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionToggle}>
          Lossless
          <Checkbox
            name="lossless"
            checked={lossless}
            onChange={this._inputChange('lossless', 'boolean')}
          />
        </label>
        <Expander>
          {!lossless && (
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
                            step="0.1"
                            value={alphaQuality}
                            onInput={this._inputChange(
                              'alphaQuality',
                              'number',
                            )}
                          >
                            Alpha quality:
                          </Range>
                        </div>
                      )}
                    </Expander>
                  </div>
                )}
              </Expander>
            </div>
          )}
        </Expander>
        <div class={style.optionOneCell}>
          <Range
            min="1"
            max="9"
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
