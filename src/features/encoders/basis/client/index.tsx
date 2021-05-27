import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
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
      // .value
      quality: inputFieldValueAsNumber(form.quality, options.quality),
      compression: inputFieldValueAsNumber(
        form.compression,
        options.compression,
      ),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props, { showAdvanced }: State) {
    // I'm rendering both lossy and lossless forms, as it becomes much easier when
    // gathering the data.
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
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
                  <label class={style.optionToggle}>
                    sRGB Mipmapping
                    <Checkbox
                      name="srgb_mipmap"
                      checked={options.srgb_mipmap}
                      onChange={this.onChange}
                    />
                  </label>
                ) : null}
              </Expander>
            </div>
          ) : null}
        </Expander>
      </form>
    );
  }
}
