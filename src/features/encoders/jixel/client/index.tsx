import { defaultOptions, EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import linkState from 'linkstate';
import { preventDefault, shallowEqual } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';
import Select from 'client/lazy-app/Compress/Options/Select';

/**
 * jixel's lowest effort (Slow) at which splines, dots, learned rate, and
 * 'smallest of both' encoding take effect.
 */
const slowEffort = 5;

export const encode = async (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
  transcodeSource?: File,
) => {
  if (options.mode !== 'transcode') {
    return workerBridge.jixelEncode(signal, imageData, options);
  }

  // Compress only provides a source when transcoding is valid, so there being
  // none here means the mode outlived its opportunity.
  if (!transcodeSource) throw Error('No JPEG source available to transcode');

  return workerBridge.jixelTranscode(
    signal,
    await transcodeSource.arrayBuffer(),
    options,
  );
};

interface Props {
  options: EncodeOptions;
  /**
   * The source JPEG, when it's still intact enough to transcode. Undefined
   * means 'Transcode' isn't on offer.
   */
  transcodeSource?: File;
  onChange(newOptions: EncodeOptions): void;
}

interface State extends EncodeOptions {
  options: EncodeOptions;
  showAdvanced: boolean;
}

export class Options extends Component<Props, State> {
  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    if (state.options && shallowEqual(state.options, props.options)) {
      return null;
    }

    // Settings saved by an older release won't have the options added since,
    // so fill the gaps from the defaults.
    return {
      ...defaultOptions,
      ...props.options,
      options: props.options,
    };
  }

  // The rest of the defaults are set in getDerivedStateFromProps
  state: State = {
    showAdvanced: false,
  } as State;

  componentDidUpdate(): void {
    // Transcoding needs the source JPEG untouched, so loading a different
    // image, rotating, or switching on a processor takes the option away. Fall
    // back to Lossless, the nearest thing that can still be done.
    if (this.state.mode === 'transcode' && !this.props.transcodeSource) {
      this._updateOptions({ mode: 'lossless' });
    }
  }

  private _updateOptions(newState: Partial<State>) {
    const optionState = { ...this.state, ...newState };

    const newOptions: EncodeOptions = {
      mode: optionState.mode,
      quality: optionState.quality,
      effort: optionState.effort,
      progressive: optionState.progressive,
      progressivePasses: optionState.progressivePasses,
      patches: optionState.patches,
      splines: optionState.splines,
      dots: optionState.dots,
      lossyModular: optionState.lossyModular,
      codingTransform: optionState.codingTransform,
      learnedRate: optionState.learnedRate,
      preserveTransparentData: optionState.preserveTransparentData,
      decodingSpeed: optionState.decodingSpeed,
      progressiveDC: optionState.progressiveDC,
      groupOrder: optionState.groupOrder,
      arbiter: optionState.arbiter,
      storeJpegMetadata: optionState.storeJpegMetadata,
    };

    this.setState({
      ...newState,
      // Updating options, so we don't recalculate in getDerivedStateFromProps.
      options: newOptions,
    });

    this.props.onChange(newOptions);
  }

  private _inputChangeCallbacks = new Map<string, (event: Event) => void>();

  private _inputChange = (
    prop: keyof EncodeOptions,
    type: 'number' | 'boolean' | 'string',
  ) => {
    // Cache the callback for performance
    if (!this._inputChangeCallbacks.has(prop)) {
      this._inputChangeCallbacks.set(prop, (event: Event) => {
        const formEl = event.target as HTMLInputElement | HTMLSelectElement;
        const newVal =
          type === 'boolean'
            ? (formEl as HTMLInputElement).checked
            : type === 'string'
            ? formEl.value
            : Number(formEl.value);

        this._updateOptions({ [prop]: newVal });
      });
    }

    return this._inputChangeCallbacks.get(prop)!;
  };

  render(
    { transcodeSource }: Props,
    {
      showAdvanced,
      mode,
      quality,
      effort,
      progressive,
      progressivePasses,
      patches,
      splines,
      dots,
      lossyModular,
      codingTransform,
      learnedRate,
      preserveTransparentData,
      decodingSpeed,
      progressiveDC,
      groupOrder,
      arbiter,
      storeJpegMetadata,
    }: State,
  ) {
    const lossy = mode === 'lossy';
    const lossless = mode === 'lossless';
    const transcode = mode === 'transcode';
    // Splines, dots and learned rate all sit alongside VarDCT, so they do
    // nothing when the modular arm always wins.
    const varDct = lossy && lossyModular !== 'force';
    const slow = effort >= slowEffort;
    // jixel draws splines and dots on the XYB planes, and drops them in any
    // other colour space.
    const splineTools = varDct && slow && codingTransform === 'xyb';

    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          Mode:
          <Select value={mode} onChange={this._inputChange('mode', 'string')}>
            <option value="lossy">Lossy</option>
            <option value="lossless">Lossless</option>
            {/* Keep the option present while it's the current value, so the
                select doesn't render as something the user didn't pick -
                componentDidUpdate switches away from it. */}
            {(transcodeSource || transcode) && (
              <option value="transcode">Transcode</option>
            )}
          </Select>
        </label>
        <Expander>
          {lossy && (
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
                {lossy && (
                  <div>
                    <label class={style.optionTextFirst}>
                      Encoding:
                      <Select
                        value={lossyModular}
                        onChange={this._inputChange('lossyModular', 'string')}
                      >
                        <option value="off">VarDCT</option>
                        <option value="force">Modular</option>
                        {/* Below Slow, jixel ignores 'auto' and uses VarDCT.
                            Same trick as Transcode above to keep the select
                            honest. */}
                        {(slow || lossyModular === 'auto') && (
                          <option value="auto">Smallest of both</option>
                        )}
                      </Select>
                    </label>
                    <label class={style.optionTextFirst}>
                      Color space:
                      <Select
                        value={codingTransform}
                        onChange={this._inputChange(
                          'codingTransform',
                          'string',
                        )}
                      >
                        <option value="xyb">XYB</option>
                        <option value="ycbcr">YCbCr</option>
                        <option value="rgb">RGB</option>
                      </Select>
                    </label>
                    <label class={style.optionTextFirst}>
                      Tune for:
                      <Select
                        value={arbiter}
                        onChange={this._inputChange('arbiter', 'string')}
                      >
                        <option value="ssimulacra2">SSIMULACRA2</option>
                        <option value="cvvdp">ColorVideoVDP</option>
                      </Select>
                    </label>
                    <label class={style.optionToggle}>
                      Preserve transparent data
                      <Checkbox
                        checked={preserveTransparentData}
                        onChange={this._inputChange(
                          'preserveTransparentData',
                          'boolean',
                        )}
                      />
                    </label>
                  </div>
                )}
              </Expander>
              <Expander>
                {varDct && slow && (
                  <div>
                    <label class={style.optionToggle}>
                      Image-adapted transforms
                      <Checkbox
                        checked={learnedRate}
                        onChange={this._inputChange('learnedRate', 'boolean')}
                      />
                    </label>
                  </div>
                )}
              </Expander>
              <Expander>
                {splineTools && (
                  <div>
                    <label class={style.optionToggle}>
                      Splines (experimental)
                      <Checkbox
                        checked={splines}
                        onChange={this._inputChange('splines', 'boolean')}
                      />
                    </label>
                    <label class={style.optionToggle}>
                      Dots (experimental)
                      <Checkbox
                        checked={dots}
                        onChange={this._inputChange('dots', 'boolean')}
                      />
                    </label>
                  </div>
                )}
              </Expander>
              <Expander>
                {!transcode && (
                  <div>
                    <label class={style.optionToggle}>
                      Patches
                      <Checkbox
                        checked={patches}
                        onChange={this._inputChange('patches', 'boolean')}
                      />
                    </label>
                    <label class={style.optionToggle}>
                      Progressive
                      <Checkbox
                        checked={progressive}
                        onChange={this._inputChange('progressive', 'boolean')}
                      />
                    </label>
                  </div>
                )}
              </Expander>
              {/* Lossless progressive is a single Squeeze transform, so the
                  pass count is lossy-only. */}
              <Expander>
                {lossy && progressive && (
                  <div class={style.optionOneCell}>
                    <Range
                      min="2"
                      max="4"
                      value={progressivePasses}
                      onInput={this._inputChange('progressivePasses', 'number')}
                    >
                      Passes:
                    </Range>
                  </div>
                )}
              </Expander>
              {/* Both reorder or split up the VarDCT frame, so they do
                  nothing for the modular arm. */}
              <Expander>
                {varDct && (
                  <div>
                    <label class={style.optionTextFirst}>
                      Tile order:
                      <Select
                        value={groupOrder}
                        onChange={this._inputChange('groupOrder', 'string')}
                      >
                        <option value="scanline">Scanline</option>
                        <option value="center">From center</option>
                        <option value="diagonals">Diagonals</option>
                      </Select>
                    </label>
                    <Expander>
                      {codingTransform === 'xyb' && (
                        <label class={style.optionToggle}>
                          Progressive DC
                          <Checkbox
                            checked={progressiveDC}
                            onChange={this._inputChange(
                              'progressiveDC',
                              'boolean',
                            )}
                          />
                        </label>
                      )}
                    </Expander>
                  </div>
                )}
              </Expander>
              <Expander>
                {lossless && (
                  <div class={style.optionOneCell}>
                    <Range
                      min="0"
                      max="2"
                      value={decodingSpeed}
                      onInput={this._inputChange('decodingSpeed', 'number')}
                    >
                      Faster decoding:
                    </Range>
                  </div>
                )}
              </Expander>
              <Expander>
                {transcode && (
                  <label class={style.optionToggle}>
                    Allow full reverse transcoding
                    <Checkbox
                      checked={storeJpegMetadata}
                      onChange={this._inputChange(
                        'storeJpegMetadata',
                        'boolean',
                      )}
                    />
                  </label>
                )}
              </Expander>
            </div>
          )}
        </Expander>
        <div class={style.optionOneCell}>
          <Range
            min="1"
            max="6"
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
