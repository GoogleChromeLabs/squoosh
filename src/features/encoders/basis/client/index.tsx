import { EncodeOptions, defaultOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component, Fragment } from 'preact';
import {
  inputFieldChecked,
  inputFieldValueAsNumber,
  preventDefault,
} from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import linkState from 'linkstate';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Select from 'client/lazy-app/Compress/Options/Select';
import Revealer from 'client/lazy-app/Compress/Options/Revealer';

export function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) {
  return workerBridge.basisEncode(signal, imageData, options);
}

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

  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;

    const newOptions: EncodeOptions = {
      ...this.props.options,
      uastc: form.mode.value === '1',
      y_flip: inputFieldChecked(form.y_flip, options.y_flip),
      perceptual: inputFieldChecked(form.perceptual, options.perceptual),
      mipmap: inputFieldChecked(form.mipmap, options.mipmap),
      srgb_mipmap: inputFieldChecked(form.srgb_mipmap, options.srgb_mipmap),
      mipmap_filter: form.mipmap_filter?.value ?? defaultOptions.mipmap_filter,
      // FIXME: We really should support range remapping
      // in the range-slider component. For now I’ll
      // shoe-horn it into the state management.
      mipmap_min_dimension:
        2 **
        inputFieldValueAsNumber(
          form.mipmap_min_dimension,
          Math.floor(Math.log2(options.mipmap_min_dimension)),
        ),
      quality: inputFieldValueAsNumber(form.quality, options.quality),
      compression: inputFieldValueAsNumber(
        form.compression,
        options.compression,
      ),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props, { showAdvanced }: State) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionTextFirst}>
          Mode:
          <Select
            name="mode"
            value={options.uastc ? '1' : '0'}
            onChange={this.onChange}
          >
            <option value="0">Compression (ETC1S)</option>
            <option value="1">Quality (UASTC)</option>
          </Select>
        </label>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="1"
            max="255"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="compression"
            min="0"
            max="4"
            value={options.compression}
            onInput={this.onChange}
          >
            Compression:
          </Range>
        </div>
        <label class={style.optionToggle}>
          Flip Y Axis
          <Checkbox
            name="y_flip"
            checked={options.y_flip}
            onChange={this.onChange}
          />
        </label>
        <label class={style.optionReveal}>
          <Revealer
            checked={showAdvanced}
            onChange={linkState(this, 'showAdvanced')}
          />
          Advanced settings
        </label>
        <Expander>
          {showAdvanced ? (
            <div>
              <label class={style.optionToggle}>
                Perceptual distance metric
                <Checkbox
                  name="perceptual"
                  checked={options.perceptual}
                  onChange={this.onChange}
                />
              </label>
              <label class={style.optionToggle}>
                Embed Mipmaps
                <Checkbox
                  name="mipmap"
                  checked={options.mipmap}
                  onChange={this.onChange}
                />
              </label>
              <Expander>
                {options.mipmap ? (
                  <Fragment>
                    <div class={style.optionOneCell}>
                      <Range
                        min="0"
                        max="10"
                        name="mipmap_min_dimension"
                        value={Math.floor(
                          Math.log2(options.mipmap_min_dimension),
                        )}
                        onInput={this.onChange}
                      >
                        Smallest mipmap (2^x):
                      </Range>
                    </div>
                    <label class={style.optionTextFirst}>
                      Resampling filter:
                      <Select
                        name="mipmap_filter"
                        value={options.mipmap_filter}
                        onChange={this.onChange}
                      >
                        <option value="box">Box</option>
                        <option value="tent">Tent</option>
                        <option value="bell">Bell</option>
                        <option value="b-spline">B-Spline</option>
                        <option value="mitchell">Mitchell</option>
                        <option value="blackman">Blackman</option>
                        <option value="lanczos3">Lanczos3</option>
                        <option value="lanczos4">Lanczos4</option>
                        <option value="lanczos6">Lanczos6</option>
                        <option value="lanczos12">Lanczos12</option>
                        <option value="kaiser">Kaiser</option>
                        <option value="gaussian">Gaussian</option>
                        <option value="catmullrom">Catmullrom</option>
                        <option value="quadratic_interp">
                          Quadratic Interpolation
                        </option>
                        <option value="quadratic_approx">
                          Quadratic Approx
                        </option>
                        <option value="quadratic_mix">Quadratic Mix</option>
                      </Select>
                    </label>
                    <label class={style.optionToggle}>
                      sRGB Mipmapping
                      <Checkbox
                        name="srgb_mipmap"
                        checked={options.srgb_mipmap}
                        onChange={this.onChange}
                      />
                    </label>
                  </Fragment>
                ) : null}
              </Expander>
            </div>
          ) : null}
        </Expander>
      </form>
    );
  }
}
