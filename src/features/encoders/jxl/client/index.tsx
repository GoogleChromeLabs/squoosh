import { defaultOptions, EncodeOptions, Mode } from '../shared/meta';
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

export const encode = async (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
  transcodeSource?: File,
) => {
  if (options.mode !== 'transcode') {
    return workerBridge.jxlEncode(signal, imageData, options);
  }

  // Transcode mode recompresses the source JPEG itself rather than the pixels
  // we were handed. Compress only provides a source when that's valid, so
  // there being none here means the mode outlived its opportunity.
  if (!transcodeSource) throw Error('No JPEG source available to transcode');

  return workerBridge.jxlTranscode(
    signal,
    await transcodeSource.arrayBuffer(),
    imageData.width,
    imageData.height,
    options,
  );
};

interface Props {
  options: EncodeOptions;
  /**
   * The source JPEG, when it's still intact enough to transcode. Undefined
   * means 'Transcode' isn't on offer - see `transcodeSource` in Compress.
   */
  transcodeSource?: File;
  onChange(newOptions: EncodeOptions): void;
}

interface State {
  options: EncodeOptions;
  quality: number;
  showAdvanced: boolean;
  separateAlpha: boolean;
  alphaQuality: number;
  mode: Mode;
  effort: number;
  modular: boolean;
  progressiveAC: boolean;
  qProgressiveAC: boolean;
  progressiveDC: number;
  groupOrder: number;
  photonNoiseIso: number;
  decodingSpeed: number;
  storeJpegMetadata: boolean;
  keepMetadata: boolean;
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

    // Settings saved by an older release won't have the options added since, so
    // fall back to the defaults rather than feeding undefined into the form.
    // `mode` is the one that matters: an absent one encodes as lossy, which is
    // also the default, so the form and the encode agree.
    const {
      mode = defaultOptions.mode,
      storeJpegMetadata = defaultOptions.storeJpegMetadata,
      keepMetadata = defaultOptions.keepMetadata,
    } = options;

    // qualityAlpha of -1 means "same as quality"; otherwise it's a separate
    // alpha quality.
    const separateAlpha = options.qualityAlpha !== -1;

    // Create default form state from options
    return {
      options,
      quality: options.quality,
      separateAlpha,
      alphaQuality: separateAlpha ? options.qualityAlpha : options.quality,
      mode,
      effort: options.effort,
      modular: options.modular,
      progressiveAC: options.progressiveAC,
      qProgressiveAC: options.qProgressiveAC,
      progressiveDC: options.progressiveDC,
      groupOrder: options.groupOrder,
      photonNoiseIso: options.photonNoiseIso,
      decodingSpeed: options.decodingSpeed,
      storeJpegMetadata,
      keepMetadata,
    };
  }

  // The rest of the defaults are set in getDerivedStateFromProps
  state: State = {
    mode: 'lossy',
    showAdvanced: false,
  } as State;

  componentDidUpdate(): void {
    // Transcoding needs the source JPEG untouched, so loading a different
    // image, rotating, or switching on a processor takes the option away. Fall
    // back to Lossless - the nearest thing that can still be done - rather
    // than leaving a mode selected that can no longer run.
    if (this.state.mode === 'transcode' && !this.props.transcodeSource) {
      this._updateOptions({ mode: 'lossless' });
    }
  }

  /**
   * Apply a change to the form state, and report the encode options it adds up
   * to.
   */
  private _updateOptions(newState: Partial<State>) {
    const optionState = {
      ...this.state,
      ...newState,
    };

    const { mode } = optionState;
    const lossy = mode === 'lossy';
    const transcode = mode === 'transcode';
    // Lossless always encodes as modular, whatever the Encoding select says.
    const isModular = mode === 'lossless' || optionState.modular;

    const newOptions: EncodeOptions = {
      quality: optionState.quality,
      qualityAlpha:
        !lossy || !optionState.separateAlpha
          ? -1 // Use the same quality as the colour channels.
          : optionState.alphaQuality,
      mode,
      effort: optionState.effort,
      modular: optionState.modular,
      progressiveAC: optionState.progressiveAC,
      // Shift quantization is forced on for lossless, and for transcode (which
      // flags its frame lossless), so the choice is meaningless there.
      qProgressiveAC: lossy ? optionState.qProgressiveAC : false,
      // DC passes are VarDCT-only, and only apply when progressive (AC) is on.
      // libjxl also drops the DC frame for a JPEG frame, so a transcode never
      // gets them. Treat as Off otherwise.
      progressiveDC:
        optionState.progressiveAC && !isModular && !transcode
          ? optionState.progressiveDC
          : 0,
      groupOrder: optionState.groupOrder,
      photonNoiseIso: optionState.photonNoiseIso,
      decodingSpeed: optionState.decodingSpeed,
      storeJpegMetadata: optionState.storeJpegMetadata,
      // Storing reconstruction data needs the metadata that was in the JPEG,
      // and libjxl rejects asking for both.
      keepMetadata: optionState.storeJpegMetadata || optionState.keepMetadata,
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
    prop: keyof State,
    type: 'number' | 'boolean' | 'string',
  ) => {
    // Cache the callback for performance
    if (!this._inputChangeCallbacks.has(prop)) {
      this._inputChangeCallbacks.set(prop, (event: Event) => {
        const formEl = event.target as HTMLInputElement | HTMLSelectElement;
        const newVal =
          type === 'boolean'
            ? 'checked' in formEl
              ? formEl.checked
              : // <select> used as a boolean: option values are "0" / "1".
                formEl.value === '1'
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
      quality,
      showAdvanced,
      separateAlpha,
      alphaQuality,
      mode,
      effort,
      modular,
      progressiveAC,
      qProgressiveAC,
      progressiveDC,
      groupOrder,
      photonNoiseIso,
      decodingSpeed,
      storeJpegMetadata,
      keepMetadata,
    }: State,
  ) {
    const lossy = mode === 'lossy';
    const transcode = mode === 'transcode';
    // Lossless always encodes as modular, whatever the Encoding select says.
    const isModular = mode === 'lossless' || modular;

    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          Mode:
          <Select value={mode} onChange={this._inputChange('mode', 'string')}>
            <option value="lossy">Lossy</option>
            <option value="lossless">Lossless</option>
            {/* Transcoding needs an untouched JPEG source. Keep the option
                present while it's the current value, so the select doesn't
                render as something the user didn't pick - componentDidUpdate
                switches away from it. */}
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
                        value={modular ? 1 : 0}
                        onChange={this._inputChange('modular', 'boolean')}
                      >
                        <option value="0">VarDCT</option>
                        <option value="1">Modular</option>
                      </Select>
                    </label>
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
                    <div class={style.optionOneCell}>
                      <Range
                        min="0"
                        max="50000"
                        step="100"
                        value={photonNoiseIso}
                        onInput={this._inputChange('photonNoiseIso', 'number')}
                      >
                        Noise equivalent to ISO:
                      </Range>
                    </div>
                  </div>
                )}
              </Expander>
              {/* Tile order and progressive apply in every mode: VarDCT, lossy
                  modular, lossless, and transcode. */}
              <label class={style.optionTextFirst}>
                Tile order:
                <Select
                  value={groupOrder}
                  onChange={this._inputChange('groupOrder', 'number')}
                >
                  <option value="0">Scanline</option>
                  <option value="1">From center</option>
                </Select>
              </label>
              <label class={style.optionToggle}>
                Progressive
                <Checkbox
                  checked={progressiveAC}
                  onChange={this._inputChange('progressiveAC', 'boolean')}
                />
              </label>
              <Expander>
                {progressiveAC && (
                  <div>
                    {/* Shift quantization is forced on for lossless and
                        transcode, and the extra DC passes are VarDCT-only and
                        unavailable to a transcode, so each is offered only
                        where it does something. */}
                    <Expander>
                      {lossy && (
                        <div>
                          <label class={style.optionToggle}>
                            Progressive shift quantization
                            <Checkbox
                              checked={qProgressiveAC}
                              onChange={this._inputChange(
                                'qProgressiveAC',
                                'boolean',
                              )}
                            />
                          </label>
                        </div>
                      )}
                    </Expander>
                    <Expander>
                      {!isModular && !transcode && (
                        <div>
                          <label class={style.optionTextFirst}>
                            Progressive DC:
                            <Select
                              value={progressiveDC}
                              onChange={this._inputChange(
                                'progressiveDC',
                                'number',
                              )}
                            >
                              <option value="0">Off</option>
                              <option value="1">One pass</option>
                              <option value="2">Two pass</option>
                            </Select>
                          </label>
                        </div>
                      )}
                    </Expander>
                  </div>
                )}
              </Expander>
              {/* A transcode is the only mode that can offer to rebuild the
                  original file, and the only one that carries anything over
                  from it - so it's the only one with metadata to keep. */}
              <Expander>
                {transcode && (
                  <label class={style.optionToggle}>
                    Allow JPEG reconstruction
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
              {/* Keeping the metadata isn't optional when we're also storing
                  enough to rebuild the original file. */}
              <Expander>
                {transcode && !storeJpegMetadata && (
                  <label class={style.optionToggle}>
                    Keep metadata
                    <Checkbox
                      checked={keepMetadata}
                      onChange={this._inputChange('keepMetadata', 'boolean')}
                    />
                  </label>
                )}
              </Expander>
              <div class={style.optionOneCell}>
                <Range
                  min="0"
                  max="4"
                  value={decodingSpeed}
                  onInput={this._inputChange('decodingSpeed', 'number')}
                >
                  Faster decoding:
                </Range>
              </div>
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
