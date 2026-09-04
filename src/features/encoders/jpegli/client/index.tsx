import { EncodeOptions, JpegliChromaSubsample } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import { inputFieldValueAsNumber, preventDefault } from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Select from 'client/lazy-app/Compress/Options/Select';

export function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) {
  return workerBridge.jpegliEncode(signal, imageData, options);
}

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

export class Options extends Component<Props, {}> {
  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;

    const newOptions: EncodeOptions = {
      quality: inputFieldValueAsNumber(form.quality, options.quality),
      progressiveLevel: inputFieldValueAsNumber(
        form.progressiveLevel,
        options.progressiveLevel,
      ),
      chromaSubsampling: inputFieldValueAsNumber(
        form.chromaSubsampling,
        options.chromaSubsampling,
      ),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="1"
            max="100"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
        <label class={style.optionTextFirst}>
          Chroma subsampling:
          <Select
            name="chromaSubsampling"
            value={options.chromaSubsampling}
            onChange={this.onChange}
          >
            <option value={JpegliChromaSubsample.YCbCr444}>4:4:4</option>
            <option value={JpegliChromaSubsample.YCbCr422}>4:2:2</option>
            <option value={JpegliChromaSubsample.YCbCr440}>4:4:0</option>
            <option value={JpegliChromaSubsample.YCbCr420}>4:2:0</option>
          </Select>
        </label>
        <label class={style.optionTextFirst}>
          Progressive passes:
          <Select
            name="progressiveLevel"
            value={options.progressiveLevel}
            onChange={this.onChange}
          >
            <option value={0}>0 (sequential)</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </Select>
        </label>
      </form>
    );
  }
}
