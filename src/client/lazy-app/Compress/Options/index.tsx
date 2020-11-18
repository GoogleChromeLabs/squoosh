import { h, Component } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import { cleanSet, cleanMerge } from '../../util/clean-modify';

import type { SourceImage, OutputType } from '..';
import {
  EncoderOptions,
  EncoderState,
  ProcessorState,
  ProcessorOptions,
  encoderMap,
} from '../../feature-meta';
import Expander from './Expander';
import Checkbox from './Checkbox';
import Select from './Select';
import { Options as QuantOptionsComponent } from 'features/processors/quantize/client';
import { Options as ResizeOptionsComponent } from 'features/processors/resize/client';

interface Props {
  mobileView: boolean;
  source?: SourceImage;
  encoderState?: EncoderState;
  processorState: ProcessorState;
  onEncoderTypeChange(newType: OutputType): void;
  onEncoderOptionsChange(newOptions: EncoderOptions): void;
  onProcessorOptionsChange(newOptions: ProcessorState): void;
}

interface State {
  supportedEncoderMap?: PartialButNotUndefined<typeof encoderMap>;
}

type PartialButNotUndefined<T> = {
  [P in keyof T]: T[P];
};

const supportedEncoderMapP: Promise<PartialButNotUndefined<
  typeof encoderMap
>> = (async () => {
  const supportedEncoderMap: PartialButNotUndefined<typeof encoderMap> = {
    ...encoderMap,
  };

  // Filter out entries where the feature test fails
  await Promise.all(
    Object.entries(encoderMap).map(async ([encoderName, details]) => {
      if ('featureTest' in details && !(await details.featureTest())) {
        delete supportedEncoderMap[encoderName as keyof typeof encoderMap];
      }
    }),
  );

  return supportedEncoderMap;
})();

export default class Options extends Component<Props, State> {
  state: State = {
    supportedEncoderMap: undefined,
  };

  constructor() {
    super();
    supportedEncoderMapP.then((supportedEncoderMap) =>
      this.setState({ supportedEncoderMap }),
    );
  }

  private onEncoderTypeChange = (event: Event) => {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as OutputType;
    this.props.onEncoderTypeChange(type);
  };

  private onProcessorEnabledChange = (event: Event) => {
    const el = event.currentTarget as HTMLInputElement;
    const processor = el.name.split('.')[0] as keyof ProcessorState;

    this.props.onProcessorOptionsChange(
      cleanSet(this.props.processorState, `${processor}.enabled`, el.checked),
    );
  };

  private onQuantizerOptionsChange = (opts: ProcessorOptions['quantize']) => {
    this.props.onProcessorOptionsChange(
      cleanMerge(this.props.processorState, 'quantize', opts),
    );
  };

  private onResizeOptionsChange = (opts: ProcessorOptions['resize']) => {
    this.props.onProcessorOptionsChange(
      cleanMerge(this.props.processorState, 'resize', opts),
    );
  };

  render(
    { source, encoderState, processorState, onEncoderOptionsChange }: Props,
    { supportedEncoderMap }: State,
  ) {
    const encoder = encoderState && encoderMap[encoderState.type];
    const EncoderOptionComponent =
      encoder && 'Options' in encoder ? encoder.Options : undefined;

    return (
      <div class={style.optionsScroller}>
        <Expander>
          {!encoderState ? null : (
            <div>
              <h3 class={style.optionsTitle}>Edit</h3>
              <label class={style.sectionEnabler}>
                <Checkbox
                  name="resize.enable"
                  checked={!!processorState.resize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
                Resize
              </label>
              <Expander>
                {processorState.resize.enabled ? (
                  <ResizeOptionsComponent
                    isVector={Boolean(source && source.vectorImage)}
                    inputWidth={source ? source.preprocessed.width : 1}
                    inputHeight={source ? source.preprocessed.height : 1}
                    options={processorState.resize}
                    onChange={this.onResizeOptionsChange}
                  />
                ) : null}
              </Expander>

              <label class={style.sectionEnabler}>
                <Checkbox
                  name="quantize.enable"
                  checked={!!processorState.quantize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
                Reduce palette
              </label>
              <Expander>
                {processorState.quantize.enabled ? (
                  <QuantOptionsComponent
                    options={processorState.quantize}
                    onChange={this.onQuantizerOptionsChange}
                  />
                ) : null}
              </Expander>
            </div>
          )}
        </Expander>

        <h3 class={style.optionsTitle}>Compress</h3>

        <section class={`${style.optionOneCell} ${style.optionsSection}`}>
          {supportedEncoderMap ? (
            <Select
              value={encoderState ? encoderState.type : 'identity'}
              onChange={this.onEncoderTypeChange}
              large
            >
              <option value="identity">Original Image</option>
              {Object.entries(supportedEncoderMap).map(([type, encoder]) => (
                <option value={type}>{encoder.meta.label}</option>
              ))}
            </Select>
          ) : (
            <Select large>
              <option>Loading…</option>
            </Select>
          )}
        </section>

        <Expander>
          {EncoderOptionComponent && (
            <EncoderOptionComponent
              options={
                // Casting options, as encoderOptionsComponentMap[encodeData.type] ensures
                // the correct type, but typescript isn't smart enough.
                encoderState!.options as any
              }
              onChange={onEncoderOptionsChange}
            />
          )}
        </Expander>
      </div>
    );
  }
}
