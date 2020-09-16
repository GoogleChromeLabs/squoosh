import { h, Component } from 'preact';
import { preventDefault, shallowEqual } from '../../lib/util';
import { EncodeOptions, defaultOptions } from './encoder-meta';
import * as style from '../../components/Options/style.scss';
import Checkbox from '../../components/checkbox';
import Expander from '../../components/expander';
import Select from '../../components/select';
import Range from '../../components/range';
import linkState from 'linkstate';

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

interface State {
  options: EncodeOptions;
  lossless: boolean;
  maxQuality: number;
  minQuality: number;
  separateAlpha: boolean;
  losslessAlpha: boolean;
  maxAlphaQuality: number;
  minAlphaQuality: number;
  showAdvanced: boolean;
  grayscale: boolean;
  subsample: number;
  tileRows: number;
  tileCols: number;
  effort: number;
}

const maxQuant = 63;
const maxSpeed = 10;

export default class AVIFEncoderOptions extends Component<Props, State> {
  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | undefined {
    if (state.options && shallowEqual(state.options, props.options)) return;
    const { options } = props;

    const lossless = options.maxQuantizer === 0 && options.minQuantizer === 0;
    const minQuantizerValue = lossless
      ? defaultOptions.minQuantizer
      : options.minQuantizer;
    const maxQuantizerValue = lossless
      ? defaultOptions.maxQuantizer
      : options.maxQuantizer;
    const losslessAlpha =
      options.maxQuantizerAlpha === 0 && options.minQuantizerAlpha === 0;
    const minQuantizerAlphaValue = losslessAlpha
      ? defaultOptions.minQuantizerAlpha
      : options.minQuantizerAlpha;
    const maxQuantizerAlphaValue = losslessAlpha
      ? defaultOptions.maxQuantizerAlpha
      : options.maxQuantizerAlpha;

    // Create default form state from options
    return {
      options,
      lossless,
      losslessAlpha,
      maxQuality: maxQuant - minQuantizerValue,
      minQuality: maxQuant - maxQuantizerValue,
      separateAlpha:
        options.maxQuantizer !== options.maxQuantizerAlpha ||
        options.minQuantizer !== options.minQuantizerAlpha,
      maxAlphaQuality: maxQuant - minQuantizerAlphaValue,
      minAlphaQuality: maxQuant - maxQuantizerAlphaValue,
      grayscale: options.subsample === 0,
      subsample:
        options.subsample === 0 || lossless
          ? defaultOptions.subsample
          : options.subsample,
      tileRows: options.tileRowsLog2,
      tileCols: options.tileColsLog2,
      effort: maxSpeed - options.speed,
    };
  }

  // The rest of the defaults are set in getDerivedStateFromProps
  state: State = {
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

        // Ensure that min cannot be greater than max
        switch (prop) {
          case 'maxQuality':
            if (newVal < this.state.minQuality) {
              newState.minQuality = newVal as number;
            }
            break;
          case 'minQuality':
            if (newVal > this.state.maxQuality) {
              newState.maxQuality = newVal as number;
            }
            break;
          case 'maxAlphaQuality':
            if (newVal < this.state.minAlphaQuality) {
              newState.minAlphaQuality = newVal as number;
            }
            break;
          case 'minAlphaQuality':
            if (newVal > this.state.maxAlphaQuality) {
              newState.maxAlphaQuality = newVal as number;
            }
            break;
        }

        const optionState = {
          ...this.state,
          ...newState,
        };

        const maxQuantizer = optionState.lossless
          ? 0
          : maxQuant - optionState.minQuality;
        const minQuantizer = optionState.lossless
          ? 0
          : maxQuant - optionState.maxQuality;

        const newOptions: EncodeOptions = {
          maxQuantizer,
          minQuantizer,
          maxQuantizerAlpha: optionState.separateAlpha
            ? optionState.losslessAlpha
              ? 0
              : maxQuant - optionState.minAlphaQuality
            : maxQuantizer,
          minQuantizerAlpha: optionState.separateAlpha
            ? optionState.losslessAlpha
              ? 0
              : maxQuant - optionState.maxAlphaQuality
            : minQuantizer,
          // Always set to 4:4:4 if lossless
          subsample: optionState.grayscale
            ? 0
            : optionState.lossless
            ? 3
            : optionState.subsample,
          tileColsLog2: optionState.tileCols,
          tileRowsLog2: optionState.tileRows,
          speed: maxSpeed - optionState.effort,
        };

        // Updating options, so we don't recalculate in getDerivedStateFromProps.
        newState.options = newOptions;

        this.setState(
          // It isn't clear to me why I have to cast this :)
          newState as State,
        );

        this.props.onChange(newOptions);
      });
    }

    return this._inputChangeCallbacks.get(prop)!;
  };

  render(
    _: Props,
    {
      effort,
      grayscale,
      lossless,
      losslessAlpha,
      maxAlphaQuality,
      maxQuality,
      minAlphaQuality,
      minQuality,
      separateAlpha,
      showAdvanced,
      subsample,
      tileCols,
      tileRows,
    }: State,
  ) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionInputFirst}>
          <Checkbox
            checked={lossless}
            onChange={this._inputChange('lossless', 'boolean')}
          />
          Lossless
        </label>
        <Expander>
          {!lossless && (
            <div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="62"
                  value={maxQuality}
                  onInput={this._inputChange('maxQuality', 'number')}
                >
                  Max quality:
                </Range>
              </div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="62"
                  value={minQuality}
                  onInput={this._inputChange('minQuality', 'number')}
                >
                  Min quality:
                </Range>
              </div>
            </div>
          )}
        </Expander>
        <label class={style.optionInputFirst}>
          <Checkbox
            checked={separateAlpha}
            onChange={this._inputChange('separateAlpha', 'boolean')}
          />
          Separate alpha quality
        </label>
        <Expander>
          {separateAlpha && (
            <div>
              <label class={style.optionInputFirst}>
                <Checkbox
                  checked={losslessAlpha}
                  onChange={this._inputChange('losslessAlpha', 'boolean')}
                />
                Lossless alpha
              </label>
              <Expander>
                {!losslessAlpha && (
                  <div>
                    <div class={style.optionOneCell}>
                      <Range
                        min="0"
                        max="62"
                        value={maxAlphaQuality}
                        onInput={this._inputChange('maxAlphaQuality', 'number')}
                      >
                        Max alpha quality:
                      </Range>
                    </div>
                    <div class={style.optionOneCell}>
                      <Range
                        min="0"
                        max="62"
                        value={minAlphaQuality}
                        onInput={this._inputChange('minAlphaQuality', 'number')}
                      >
                        Min alpha quality:
                      </Range>
                    </div>
                  </div>
                )}
              </Expander>
            </div>
          )}
        </Expander>
        <label class={style.optionInputFirst}>
          <Checkbox
            checked={showAdvanced}
            onChange={linkState(this, 'showAdvanced')}
          />
          Show advanced settings
        </label>
        <Expander>
          {showAdvanced && (
            <div>
              {/*<label class={style.optionInputFirst}>
                <Checkbox
                  data-set-state="grayscale"
                  checked={grayscale}
                  onChange={this._inputChange('grayscale', 'boolean')}
                />
                Grayscale
              </label>*/}
              <Expander>
                {!grayscale && !lossless && (
                  <label class={style.optionTextFirst}>
                    Subsample chroma:
                    <Select
                      data-set-state="subsample"
                      value={subsample}
                      onChange={this._inputChange('subsample', 'number')}
                    >
                      <option value="1">4:2:0</option>
                      {/*<option value="2">4:2:2</option>*/}
                      <option value="3">4:4:4</option>
                    </Select>
                  </label>
                )}
              </Expander>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="6"
                  value={tileRows}
                  onInput={this._inputChange('tileRows', 'number')}
                >
                  Log2 of tile rows:
                </Range>
              </div>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="6"
                  value={tileCols}
                  onInput={this._inputChange('tileCols', 'number')}
                >
                  Log2 of tile cols:
                </Range>
              </div>
            </div>
          )}
        </Expander>
        <div class={style.optionOneCell}>
          <Range
            min="0"
            max="10"
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
