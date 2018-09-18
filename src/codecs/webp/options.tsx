import { h, Component } from 'preact';
import { bind, inputFieldCheckedAsNumber, inputFieldValueAsNumber } from '../../lib/util';
import { EncodeOptions, WebPImageHint } from './encoder';
import * as styles from './styles.scss';

type Props = {
  options: EncodeOptions,
  onChange(newOptions: EncodeOptions): void,
};

// From kLosslessPresets in config_enc.c
// The format is [method, quality].
const losslessPresets:[number, number][] = [
  [0, 0], [1, 20], [2, 25], [3, 30], [3, 50],
  [4, 50], [4, 75], [4, 90], [5, 90], [6, 100],
];
const losslessPresetDefault = 6;

function determineLosslessQuality(quality: number): number {
  const index = losslessPresets.findIndex(item => item[1] === quality);
  if (index !== -1) return index;
  // Quality doesn't match one of the presets.
  // This can happen when toggling 'lossless'.
  return losslessPresetDefault;
}

export default class WebPEncoderOptions extends Component<Props, {}> {
  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement;
    const lossless = inputFieldCheckedAsNumber(form.lossless);
    const losslessPresetInput = (form.lossless_preset as HTMLInputElement);

    const options: EncodeOptions = {
      // Copy over options the form doesn't care about, eg emulate_jpeg_size
      ...this.props.options,
      // And now stuff from the form:
      lossless,
      // Special-cased inputs:
      // In lossless mode, the quality is derived from the preset.
      quality: lossless ?
        losslessPresets[Number(losslessPresetInput.value)][1] :
        inputFieldValueAsNumber(form.quality),
      // In lossless mode, the method is derived from the preset.
      method: lossless ?
        losslessPresets[Number(losslessPresetInput.value)][0] :
        inputFieldValueAsNumber(form.method_input),
      image_hint: (form.image_hint as HTMLInputElement).checked ?
        WebPImageHint.WEBP_HINT_GRAPH :
        WebPImageHint.WEBP_HINT_DEFAULT,
      // .checked
      exact: inputFieldCheckedAsNumber(form.exact),
      alpha_compression: inputFieldCheckedAsNumber(form.alpha_compression),
      autofilter: inputFieldCheckedAsNumber(form.autofilter),
      filter_type: inputFieldCheckedAsNumber(form.filter_type),
      use_sharp_yuv: inputFieldCheckedAsNumber(form.use_sharp_yuv),
      // .value
      near_lossless: inputFieldValueAsNumber(form.near_lossless),
      alpha_quality: inputFieldValueAsNumber(form.alpha_quality),
      alpha_filtering: inputFieldValueAsNumber(form.alpha_filtering),
      sns_strength: inputFieldValueAsNumber(form.sns_strength),
      filter_strength: inputFieldValueAsNumber(form.filter_strength),
      filter_sharpness: inputFieldValueAsNumber(form.filter_sharpness),
      pass: inputFieldValueAsNumber(form.pass),
      preprocessing: inputFieldValueAsNumber(form.preprocessing),
      segments: inputFieldValueAsNumber(form.segments),
      partitions: inputFieldValueAsNumber(form.partitions),
    };
    this.props.onChange(options);
  }

  private _losslessSpecificOptions(options: EncodeOptions) {
    return (
      <div>
        <label>
          Effort:
          <range-input
            name="lossless_preset"
            min="0"
            max="9"
            value={'' + determineLosslessQuality(options.quality)}
            onChange={this.onChange}
          />
        </label>
        <label>
          Slight loss:
          <range-input
            class={styles.flipRange}
            name="near_lossless"
            min="0"
            max="100"
            value={'' + options.near_lossless}
            onChange={this.onChange}
          />
        </label>
        <label>
          {/*
            Although there are 3 different kinds of image hint, webp only
            seems to do something with the 'graph' type, and I don't really
            understand what it does.
          */}
          <input
            name="image_hint"
            type="checkbox"
            checked={options.image_hint === WebPImageHint.WEBP_HINT_GRAPH}
            value={'' + WebPImageHint.WEBP_HINT_GRAPH}
            onChange={this.onChange}
          />
          Discrete tone image (graph, map-tile etc)
        </label>
      </div>
    );
  }

  private _lossySpecificOptions(options: EncodeOptions) {
    return (
      <div>
        <label>
          Effort:
          <range-input
            name="method_input"
            min="0"
            max="6"
            value={'' + options.method}
            onChange={this.onChange}
          />
        </label>
        <label>
          Quality:
          <range-input
            name="quality"
            min="0"
            max="100"
            step="0.01"
            value={'' + options.quality}
            onChange={this.onChange}
          />
        </label>
        <label>
          <input
            name="alpha_compression"
            type="checkbox"
            checked={!!options.alpha_compression}
            onChange={this.onChange}
          />
          Compress alpha
        </label>
        <label>
          Alpha quality:
          <range-input
            name="alpha_quality"
            min="0"
            max="100"
            value={'' + options.alpha_quality}
            onChange={this.onChange}
          />
        </label>
        <label>
          Alpha filter quality:
          <range-input
            name="alpha_filtering"
            min="0"
            max="2"
            value={'' + options.alpha_filtering}
            onChange={this.onChange}
          />
        </label>
        <label>
          Spacial noise shaping:
          <range-input
            name="sns_strength"
            min="0"
            max="100"
            value={'' + options.sns_strength}
            onChange={this.onChange}
          />
        </label>
        <label>
          <input
            name="autofilter"
            type="checkbox"
            checked={!!options.autofilter}
            onChange={this.onChange}
          />
          Auto adjust filter strength
        </label>
        <label>
          Filter strength:
          <range-input
            name="filter_strength"
            min="0"
            max="100"
            disabled={!!options.autofilter}
            value={'' + options.filter_strength}
            onChange={this.onChange}
          />
        </label>
        <label>
          <input
            name="filter_type"
            type="checkbox"
            checked={!!options.filter_type}
            onChange={this.onChange}
          />
          Strong filter
        </label>
        <label>
          Filter sharpness:
          <range-input
            class={styles.flipRange}
            name="filter_sharpness"
            min="0"
            max="7"
            value={'' + options.filter_sharpness}
            onChange={this.onChange}
          />
        </label>
        <label>
          <input
            name="use_sharp_yuv"
            type="checkbox"
            checked={!!options.use_sharp_yuv}
            onChange={this.onChange}
          />
          Sharp RGB->YUV conversion
        </label>
        <label>
          Passes:
          <range-input
            name="pass"
            min="1"
            max="10"
            value={'' + options.pass}
            onChange={this.onChange}
          />
        </label>
        <label>
          Preprocessing type:
          <select
            name="preprocessing"
            value={'' + options.preprocessing}
            onChange={this.onChange}
          >
            <option value="0">None</option>
            <option value="1">Segment smooth</option>
            <option value="2">Pseudo-random dithering</option>
          </select>
        </label>
        <label>
          Segments:
          <range-input
            name="segments"
            min="1"
            max="4"
            value={'' + options.segments}
            onChange={this.onChange}
          />
        </label>
        <label>
          Partitions:
          <range-input
            name="partitions"
            min="0"
            max="3"
            value={'' + options.partitions}
            onChange={this.onChange}
          />
        </label>
      </div>
    );
  }

  render({ options }: Props) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
    return (
      <form>
        <label>
          <input
            name="lossless"
            type="checkbox"
            checked={!!options.lossless}
            onChange={this.onChange}
          />
          Lossless
        </label>
        <div class={options.lossless ? '' : styles.hide}>
          {this._losslessSpecificOptions(options)}
        </div>
        <div class={options.lossless ? styles.hide : ''}>
          {this._lossySpecificOptions(options)}
        </div>
        <label>
          <input
            name="exact"
            type="checkbox"
            checked={!!options.exact}
            onChange={this.onChange}
          />
          Preserve transparent data. Otherwise, pixels with zero alpha will have RGB also zeroed.
        </label>
      </form>
    );
  }
}
