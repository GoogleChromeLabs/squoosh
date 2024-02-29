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
import Toggle from './Toggle';
import Select from './Select';
import { Options as QuantOptionsComponent } from 'features/processors/quantize/client';
import { Options as ResizeOptionsComponent } from 'features/processors/resize/client';
import { ImportIcon, SaveIcon, SwapIcon } from 'client/lazy-app/icons';

interface Props {
  index: 0 | 1;
  mobileView: boolean;
  source?: SourceImage;
  encoderState?: EncoderState;
  processorState: ProcessorState;
  onEncoderTypeChange(index: 0 | 1, newType: OutputType): void;
  onEncoderOptionsChange(index: 0 | 1, newOptions: EncoderOptions): void;
  onProcessorOptionsChange(index: 0 | 1, newOptions: ProcessorState): void;
  onCopyToOtherSideClick(index: 0 | 1): void;
  onSaveSideSettingsClick(index: 0 | 1): void;
  onImportSideSettingsClick(index: 0 | 1): void;
}

interface State {
  supportedEncoderMap?: PartialButNotUndefined<typeof encoderMap>;
  leftSideSettings?: string | null;
  rightSideSettings?: string | null;
}

type PartialButNotUndefined<T> = {
  [P in keyof T]: T[P];
};

const supportedEncoderMapP: Promise<PartialButNotUndefined<typeof encoderMap>> =
  (async () => {
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
    leftSideSettings: localStorage.getItem('leftSideSettings'),
    rightSideSettings: localStorage.getItem('rightSideSettings'),
  };

  constructor() {
    super();
    supportedEncoderMapP.then((supportedEncoderMap) =>
      this.setState({ supportedEncoderMap }),
    );
  }

  private setLeftSideSettings = () => {
    this.setState({
      leftSideSettings: localStorage.getItem('leftSideSettings'),
    });
  };

  private setRightSideSettings = () => {
    this.setState({
      rightSideSettings: localStorage.getItem('rightSideSettings'),
    });
  };

  componentDidMount(): void {
    // Changing the state when side setting is stored in localstorage
    window.addEventListener('leftSideSettings', this.setLeftSideSettings);
    window.addEventListener('rightSideSettings', this.setRightSideSettings);
  }

  componentWillUnmount(): void {
    window.removeEventListener('leftSideSettings', this.setLeftSideSettings);
    window.removeEventListener('removeSideSettings', this.setRightSideSettings);
  }

  private onEncoderTypeChange = (event: Event) => {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as OutputType;
    this.props.onEncoderTypeChange(this.props.index, type);
  };

  private onProcessorEnabledChange = (event: Event) => {
    const el = event.currentTarget as HTMLInputElement;
    const processor = el.name.split('.')[0] as keyof ProcessorState;

    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanSet(this.props.processorState, `${processor}.enabled`, el.checked),
    );
  };

  private onQuantizerOptionsChange = (opts: ProcessorOptions['quantize']) => {
    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanMerge(this.props.processorState, 'quantize', opts),
    );
  };

  private onResizeOptionsChange = (opts: ProcessorOptions['resize']) => {
    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanMerge(this.props.processorState, 'resize', opts),
    );
  };

  private onEncoderOptionsChange = (newOptions: EncoderOptions) => {
    this.props.onEncoderOptionsChange(this.props.index, newOptions);
  };

  private onCopyToOtherSideClick = () => {
    this.props.onCopyToOtherSideClick(this.props.index);
  };

  private onSaveSideSettingClick = () => {
    this.props.onSaveSideSettingsClick(this.props.index);
  };

  private onImportSideSettingsClick = () => {
    this.props.onImportSideSettingsClick(this.props.index);
  };

  render(
    { source, encoderState, processorState }: Props,
    { supportedEncoderMap }: State,
  ) {
    const encoder = encoderState && encoderMap[encoderState.type];
    const EncoderOptionComponent =
      encoder && 'Options' in encoder ? encoder.Options : undefined;

    return (
      <div
        class={
          style.optionsScroller +
          ' ' +
          (encoderState ? '' : style.originalImage)
        }
      >
        <Expander>
          {!encoderState ? null : (
            <div>
              <h3 class={style.optionsTitle}>
                <div class={style.titleAndButtons}>
                  Edit
                  <button
                    class={style.copyOverButton}
                    title="Copy settings to other side"
                    onClick={this.onCopyToOtherSideClick}
                  >
                    <SwapIcon />
                  </button>
                  <button
                    class={style.saveButton}
                    title="Save side settings"
                    onClick={this.onSaveSideSettingClick}
                  >
                    <SaveIcon />
                  </button>
                  <button
                    class={
                      style.importButton +
                      ' ' +
                      (!this.state.leftSideSettings && this.props.index === 0
                        ? style.buttonOpacity
                        : '') +
                      ' ' +
                      (!this.state.rightSideSettings && this.props.index === 1
                        ? style.buttonOpacity
                        : '')
                    }
                    title="Import saved side settings"
                    onClick={this.onImportSideSettingsClick}
                    disabled={
                      // Disabled if this side's settings haven't been saved
                      (!this.state.leftSideSettings &&
                        this.props.index === 0) ||
                      (!this.state.rightSideSettings && this.props.index === 1)
                    }
                  >
                    <ImportIcon />
                  </button>
                </div>
              </h3>
              <label class={style.sectionEnabler}>
                Resize
                <Toggle
                  name="resize.enable"
                  checked={!!processorState.resize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
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
                Reduce palette
                <Toggle
                  name="quantize.enable"
                  checked={!!processorState.quantize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
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
              <option value="identity">{`Original Image ${
                this.props.source ? `(${this.props.source.file.name})` : ''
              }`}</option>
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
              onChange={this.onEncoderOptionsChange}
            />
          )}
        </Expander>
      </div>
    );
  }
}
