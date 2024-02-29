import { canvasEncode } from 'client/lazy-app/util/canvas';
import {
  abortable,
  blobToArrayBuffer,
  inputFieldChecked,
} from 'client/lazy-app/util';
import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { inputFieldValueAsNumber, preventDefault } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';

export async function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) {
  const pngBlob = await abortable(signal, canvasEncode(imageData, 'image/png'));
  const pngBuffer = await abortable(signal, blobToArrayBuffer(pngBlob));
  return workerBridge.oxipngEncode(signal, pngBuffer, options);
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
            max="3"
            step="1"
            value={options.level}
            onInput={this.onChange}
          >
            Effort:
          </Range>
        </div>
      </form>
    );
  }
}
