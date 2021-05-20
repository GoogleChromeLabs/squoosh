import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';

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
  lossless: boolean;
  slightLoss: boolean;
  autoEdgePreservingFilter: boolean;
  decodingSpeedTier: number;
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
      edgePreservingFilter: options.epf === -1 ? 2 : options.epf,
      lossless: options.quality === 100,
      slightLoss: options.lossyPalette,
      autoEdgePreservingFilter: options.epf === -1,
      decodingSpeedTier: options.decodingSpeedTier,
    };
  }

  // The rest of the defaults are set in getDerivedStateFromProps
  state: State = {
    lossless: false,
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
          speed: maxSpeed - optionState.effort,
          quality: optionState.lossless ? 100 : optionState.quality,
          progressive: optionState.progressive,
          epf: optionState.autoEdgePreservingFilter
            ? -1
            : optionState.edgePreservingFilter,
          nearLossless: 0,
          lossyPalette: optionState.lossless ? optionState.slightLoss : false,
          decodingSpeedTier: optionState.decodingSpeedTier,
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
      quality,
      progressive,
      edgePreservingFilter,
      lossless,
      slightLoss,
      autoEdgePreservingFilter,
      decodingSpeedTier,
    }: State,
  ) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
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
          {lossless && (
            <label class={style.optionToggle}>
              Slight loss
              <Checkbox
                name="slightLoss"
                checked={slightLoss}
                onChange={this._inputChange('slightLoss', 'boolean')}
              />
            </label>
          )}
        </Expander>
        <Expander>
          {!lossless && (
            <div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="99.9"
                  step="0.1"
                  value={quality}
                  onInput={this._inputChange('quality', 'number')}
                >
                  Quality:
                </Range>
              </div>
              <label class={style.optionToggle}>
                Auto edge filter
                <Checkbox
                  name="autoEdgeFilter"
                  checked={autoEdgePreservingFilter}
                  onChange={this._inputChange(
                    'autoEdgePreservingFilter',
                    'boolean',
                  )}
                />
              </label>
              <Expander>
                {!autoEdgePreservingFilter && (
                  <div class={style.optionOneCell}>
                    <Range
                      min="0"
                      max="3"
                      value={edgePreservingFilter}
                      onInput={this._inputChange(
                        'edgePreservingFilter',
                        'number',
                      )}
                    >
                      Edge preserving filter:
                    </Range>
                  </div>
                )}
              </Expander>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="4"
                  value={decodingSpeedTier}
                  onInput={this._inputChange('decodingSpeedTier', 'number')}
                >
                  Optimise for decoding speed (worse compression):
                </Range>
              </div>
            </div>
          )}
        </Expander>
        <label class={style.optionToggle}>
          Progressive rendering
          <Checkbox
            name="progressive"
            checked={progressive}
            onChange={this._inputChange('progressive', 'boolean')}
          />
        </label>
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
