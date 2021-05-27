import {
  builtinResize,
  BuiltinResizeMethod,
  drawableToImageData,
} from 'client/lazy-app/util/canvas';
import {
  BrowserResizeOptions,
  VectorResizeOptions,
  WorkerResizeOptions,
  Options as ResizeOptions,
  workerResizeMethods,
} from '../shared/meta';
import { getContainOffsets } from '../shared/util';
import type { SourceImage } from 'client/lazy-app/Compress';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import linkState from 'linkstate';
import {
  inputFieldValueAsNumber,
  inputFieldValue,
  preventDefault,
  inputFieldChecked,
} from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import { linkRef } from 'shared/prerendered-app/util';
import Select from 'client/lazy-app/Compress/Options/Select';
import Expander from 'client/lazy-app/Compress/Options/Expander';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';

/**
 * Return whether a set of options are worker resize options.
 *
 * @param opts
 */
function isWorkerOptions(opts: ResizeOptions): opts is WorkerResizeOptions {
  return (workerResizeMethods as string[]).includes(opts.method);
}

function browserResize(data: ImageData, opts: BrowserResizeOptions): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  return builtinResize(
    data,
    sx,
    sy,
    sw,
    sh,
    opts.width,
    opts.height,
    opts.method.slice('browser-'.length) as BuiltinResizeMethod,
  );
}

function vectorResize(
  data: HTMLImageElement,
  opts: VectorResizeOptions,
): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  return drawableToImageData(data, {
    sx,
    sy,
    sw,
    sh,
    width: opts.width,
    height: opts.height,
  });
}

export async function resize(
  signal: AbortSignal,
  source: SourceImage,
  options: ResizeOptions,
  workerBridge: WorkerBridge,
) {
  if (options.method === 'vector') {
    if (!source.vectorImage) throw Error('No vector image available');
    return vectorResize(source.vectorImage, options);
  }
  if (isWorkerOptions(options)) {
    return workerBridge.resize(signal, source.preprocessed, options);
  }
  return browserResize(source.preprocessed, options);
}

interface Props {
  isVector: Boolean;
  inputWidth: number;
  inputHeight: number;
  options: ResizeOptions;
  onChange(newOptions: ResizeOptions): void;
}

interface State {
  maintainAspect: boolean;
}

const sizePresets = [0.25, 0.3333, 0.5, 1, 2, 3, 4];

export class Options extends Component<Props, State> {
  state: State = {
    maintainAspect: true,
  };

  private form?: HTMLFormElement;
  private presetWidths: { [idx: number]: number } = {};
  private presetHeights: { [idx: number]: number } = {};

  constructor(props: Props) {
    super(props);
    this.generatePresetValues(props.inputWidth, props.inputHeight);
  }

  private reportOptions() {
    const form = this.form!;
    const width = form.width as HTMLInputElement;
    const height = form.height as HTMLInputElement;
    const { options } = this.props;

    if (!width.checkValidity() || !height.checkValidity()) return;

    const newOptions: ResizeOptions = {
      width: inputFieldValueAsNumber(width),
      height: inputFieldValueAsNumber(height),
      method: form.resizeMethod.value,
      premultiply: inputFieldChecked(form.premultiply, true),
      linearRGB: inputFieldChecked(form.linearRGB, true),
      // Casting, as the formfield only returns the correct values.
      fitMethod: inputFieldValue(
        form.fitMethod,
        options.fitMethod,
      ) as ResizeOptions['fitMethod'],
    };
    this.props.onChange(newOptions);
  }

  private onChange = () => {
    this.reportOptions();
  };

  private getAspect() {
    return this.props.inputWidth / this.props.inputHeight;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (!prevState.maintainAspect && this.state.maintainAspect) {
      this.form!.height.value = Math.round(
        Number(this.form!.width.value) / this.getAspect(),
      );
      this.reportOptions();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (
      this.props.inputWidth !== nextProps.inputWidth ||
      this.props.inputHeight !== nextProps.inputHeight
    ) {
      this.generatePresetValues(nextProps.inputWidth, nextProps.inputHeight);
    }
  }

  private onWidthInput = () => {
    if (this.state.maintainAspect) {
      const width = inputFieldValueAsNumber(this.form!.width);
      this.form!.height.value = Math.round(width / this.getAspect());
    }

    this.reportOptions();
  };

  private onHeightInput = () => {
    if (this.state.maintainAspect) {
      const height = inputFieldValueAsNumber(this.form!.height);
      this.form!.width.value = Math.round(height * this.getAspect());
    }

    this.reportOptions();
  };

  private generatePresetValues(width: number, height: number) {
    for (const preset of sizePresets) {
      this.presetWidths[preset] = Math.round(width * preset);
      this.presetHeights[preset] = Math.round(height * preset);
    }
  }

  private getPreset(): number | string {
    const { width, height } = this.props.options;

    for (const preset of sizePresets) {
      if (
        width === this.presetWidths[preset] &&
        height === this.presetHeights[preset]
      )
        return preset;
    }

    return 'custom';
  }

  private onPresetChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    if (select.value === 'custom') return;
    const multiplier = Number(select.value);
    (this.form!.width as HTMLInputElement).value =
      Math.round(this.props.inputWidth * multiplier) + '';
    (this.form!.height as HTMLInputElement).value =
      Math.round(this.props.inputHeight * multiplier) + '';
    this.reportOptions();
  };

  render({ options, isVector }: Props, { maintainAspect }: State) {
    return (
      <form
        ref={linkRef(this, 'form')}
        class={style.optionsSection}
        onSubmit={preventDefault}
      >
        <label class={style.optionTextFirst}>
          Method:
          <Select
            name="resizeMethod"
            value={options.method}
            onChange={this.onChange}
          >
            {isVector && <option value="vector">Vector</option>}
            <option value="lanczos3">Lanczos3</option>
            <option value="mitchell">Mitchell</option>
            <option value="catrom">Catmull-Rom</option>
            <option value="triangle">Triangle (bilinear)</option>
            <option value="hqx">hqx (pixel art)</option>
            <option value="browser-pixelated">Browser pixelated</option>
            <option value="browser-low">Browser low quality</option>
            <option value="browser-medium">Browser medium quality</option>
            <option value="browser-high">Browser high quality</option>
          </Select>
        </label>
        <label class={style.optionTextFirst}>
          Preset:
          <Select value={this.getPreset()} onChange={this.onPresetChange}>
            {sizePresets.map((preset) => (
              <option value={preset}>{preset * 100}%</option>
            ))}
            <option value="custom">Custom</option>
          </Select>
        </label>
        <label class={style.optionTextFirst}>
          Width:
          <input
            required
            class={style.textField}
            name="width"
            type="number"
            min="1"
            value={'' + options.width}
            onInput={this.onWidthInput}
          />
        </label>
        <label class={style.optionTextFirst}>
          Height:
          <input
            required
            class={style.textField}
            name="height"
            type="number"
            min="1"
            value={'' + options.height}
            onInput={this.onHeightInput}
          />
        </label>
        <Expander>
          {isWorkerOptions(options) ? (
            <label class={style.optionToggle}>
              Premultiply alpha channel
              <Checkbox
                name="premultiply"
                checked={options.premultiply}
                onChange={this.onChange}
              />
            </label>
          ) : null}
          {isWorkerOptions(options) ? (
            <label class={style.optionToggle}>
              Linear RGB
              <Checkbox
                name="linearRGB"
                checked={options.linearRGB}
                onChange={this.onChange}
              />
            </label>
          ) : null}
        </Expander>
        <label class={style.optionToggle}>
          Maintain aspect ratio
          <Checkbox
            name="maintainAspect"
            checked={maintainAspect}
            onChange={linkState(this, 'maintainAspect')}
          />
        </label>
        <Expander>
          {maintainAspect ? null : (
            <label class={style.optionTextFirst}>
              Fit method:
              <Select
                name="fitMethod"
                value={options.fitMethod}
                onChange={this.onChange}
              >
                <option value="stretch">Stretch</option>
                <option value="contain">Contain</option>
              </Select>
            </label>
          )}
        </Expander>
      </form>
    );
  }
}
