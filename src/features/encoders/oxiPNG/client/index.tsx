import { inputFieldChecked } from 'client/lazy-app/util';
import { defaultOptions, Deflaters, EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { inputFieldValueAsNumber, preventDefault } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';
import Select from 'client/lazy-app/Compress/Options/Select';

export async function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) {
  return workerBridge.oxipngEncode(signal, imageData, options);
}

type Props = {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
};

export class Options extends Component<Props, {}> {
  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;

    const options: EncodeOptions = {
      level: inputFieldValueAsNumber(form.level),
      interlace: inputFieldChecked(form.interlace),
      deflater: inputFieldValueAsNumber(form.deflater),
      iterations: inputFieldValueAsNumber(form.iterations, 5),
      compressionLevel: inputFieldValueAsNumber(form.compressionLevel, 11),
    };

    this.props.onChange(options);
  };

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <label class={style.optionToggle}>
          Interlace
          <Checkbox
            name="interlace"
            checked={options.interlace}
            onChange={this.onChange}
          />
        </label>
        <div class={style.optionOneCell}>
          <Range
            name="level"
            min="0"
            max="6"
            step="1"
            value={options.level}
            onInput={this.onChange}
          >
            Effort:
          </Range>
        </div>
        <label class={style.optionTextFirst}>
          Deflater:
          <Select
            name="deflater"
            value={options.deflater}
            onChange={this.onChange}
          >
            <option value={Deflaters.libdeflater}>Libdeflater</option>
            <option value={Deflaters.zopfli}>Zopfli</option>
          </Select>
        </label>
        {this.props.options.deflater == Deflaters.libdeflater && (
          <div class={style.optionOneCell}>
            <Range
              name="compressionLevel"
              min="1"
              max="12"
              step="1"
              value={options.compressionLevel}
              onInput={this.onChange}
            >
              Compression level:
            </Range>
          </div>
        )}
        {this.props.options.deflater == Deflaters.zopfli && (
          <div class={style.optionOneCell}>
            <Range
              name="iterations"
              min="1"
              max="15"
              step="1"
              value={options.iterations}
              onInput={this.onChange}
            >
              Iterations:
            </Range>
          </div>
        )}
      </form>
    );
  }
}
