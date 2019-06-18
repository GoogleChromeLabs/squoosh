import { h, Component } from 'preact';

import * as style from './style.scss';
import { bind } from '../../lib/initial-util';
import { cleanSet, cleanMerge } from '../../lib/clean-modify';
import OptiPNGEncoderOptions from '../../codecs/optipng/options';
import MozJpegEncoderOptions from '../../codecs/mozjpeg/options';
import BrowserJPEGEncoderOptions from '../../codecs/browser-jpeg/options';
import WebPEncoderOptions from '../../codecs/webp/options';
import BrowserWebPEncoderOptions from '../../codecs/browser-webp/options';

import QuantizerOptionsComponent from '../../codecs/imagequant/options';
import ResizeOptionsComponent from '../../codecs/resize/options';

import * as identity from '../../codecs/identity/encoder-meta';
import * as optiPNG from '../../codecs/optipng/encoder-meta';
import * as mozJPEG from '../../codecs/mozjpeg/encoder-meta';
import * as webP from '../../codecs/webp/encoder-meta';
import * as browserPNG from '../../codecs/browser-png/encoder-meta';
import * as browserJPEG from '../../codecs/browser-jpeg/encoder-meta';
import * as browserWebP from '../../codecs/browser-webp/encoder-meta';
import * as browserGIF from '../../codecs/browser-gif/encoder-meta';
import * as browserTIFF from '../../codecs/browser-tiff/encoder-meta';
import * as browserJP2 from '../../codecs/browser-jp2/encoder-meta';
import * as browserBMP from '../../codecs/browser-bmp/encoder-meta';
import * as browserPDF from '../../codecs/browser-pdf/encoder-meta';
import {
  EncoderState,
  EncoderType,
  EncoderOptions,
  encoders,
  encodersSupported,
  EncoderSupportMap,
} from '../../codecs/encoders';
import { QuantizeOptions } from '../../codecs/imagequant/processor-meta';
import { ResizeOptions } from '../../codecs/resize/processor-meta';
import { PreprocessorState } from '../../codecs/preprocessors';
import { SourceImage } from '../compress';
import Checkbox from '../checkbox';
import Expander from '../expander';
import Select from '../select';

const encoderOptionsComponentMap: {
  [x: string]: (new (...args: any[]) => Component<any, any>) | undefined;
} = {
  [identity.type]: undefined,
  [optiPNG.type]: OptiPNGEncoderOptions,
  [mozJPEG.type]: MozJpegEncoderOptions,
  [webP.type]: WebPEncoderOptions,
  [browserPNG.type]: undefined,
  [browserJPEG.type]: BrowserJPEGEncoderOptions,
  [browserWebP.type]: BrowserWebPEncoderOptions,
  [browserBMP.type]: undefined,
  // Only Safari supports the rest, and it doesn't support quality settings.
  [browserGIF.type]: undefined,
  [browserTIFF.type]: undefined,
  [browserJP2.type]: undefined,
  [browserPDF.type]: undefined,
};

interface Props {
  mobileView: boolean;
  source?: SourceImage;
  encoderState: EncoderState;
  preprocessorState: PreprocessorState;
  onEncoderTypeChange(newType: EncoderType): void;
  onEncoderOptionsChange(newOptions: EncoderOptions): void;
  onPreprocessorOptionsChange(newOptions: PreprocessorState): void;
}

interface State {
  encoderSupportMap?: EncoderSupportMap;
}

export default class Options extends Component<Props, State> {
  state: State = {
    encoderSupportMap: undefined,
  };

  constructor() {
    super();
    encodersSupported.then(encoderSupportMap => this.setState({ encoderSupportMap }));
  }

  @bind
  private onEncoderTypeChange(event: Event) {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as EncoderType;
    this.props.onEncoderTypeChange(type);
  }

  @bind
  private onPreprocessorEnabledChange(event: Event) {
    const el = event.currentTarget as HTMLInputElement;
    const preprocessor = el.name.split('.')[0] as keyof PreprocessorState;

    this.props.onPreprocessorOptionsChange(
      cleanSet(this.props.preprocessorState, `${preprocessor}.enabled`, el.checked),
    );
  }

  @bind
  private onQuantizerOptionsChange(opts: QuantizeOptions) {
    this.props.onPreprocessorOptionsChange(
      cleanMerge(this.props.preprocessorState, 'quantizer', opts),
    );
  }

  @bind
  private onResizeOptionsChange(opts: ResizeOptions) {
    this.props.onPreprocessorOptionsChange(
      cleanMerge(this.props.preprocessorState, 'resize', opts),
    );
  }

  render(
    {
      source,
      encoderState,
      preprocessorState,
      onEncoderOptionsChange,
    }: Props,
    { encoderSupportMap }: State,
  ) {
    // tslint:disable variable-name
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={style.optionsScroller}>
        <Expander>
          {encoderState.type === identity.type ? null :
            <div>
              <h3 class={style.optionsTitle}>Edit</h3>
              <label class={style.sectionEnabler}>
                <Checkbox
                  name="resize.enable"
                  checked={!!preprocessorState.resize.enabled}
                  onChange={this.onPreprocessorEnabledChange}
                />
                Resize
              </label>
              <Expander>
                {preprocessorState.resize.enabled ?
                  <ResizeOptionsComponent
                    isVector={Boolean(source && source.vectorImage)}
                    inputWidth={source ? source.processed.width : 1}
                    inputHeight={source ? source.processed.height : 1}
                    options={preprocessorState.resize}
                    onChange={this.onResizeOptionsChange}
                  />
                : null}
              </Expander>

              <label class={style.sectionEnabler}>
                <Checkbox
                  name="quantizer.enable"
                  checked={!!preprocessorState.quantizer.enabled}
                  onChange={this.onPreprocessorEnabledChange}
                />
                Reduce palette
              </label>
              <Expander>
                {preprocessorState.quantizer.enabled ?
                  <QuantizerOptionsComponent
                    options={preprocessorState.quantizer}
                    onChange={this.onQuantizerOptionsChange}
                  />
                : null}
              </Expander>
            </div>
          }
        </Expander>

        <h3 class={style.optionsTitle}>Compress</h3>

        <section class={`${style.optionOneCell} ${style.optionsSection}`}>
          {encoderSupportMap ?
            <Select value={encoderState.type} onChange={this.onEncoderTypeChange} large>
              {encoders.filter(encoder => encoderSupportMap[encoder.type]).map(encoder => (
                // tslint:disable-next-line:jsx-key
                <option value={encoder.type}>{encoder.label}</option>
              ))}
            </Select>
            :
            <Select large><option>Loading…</option></Select>
          }
        </section>

        <Expander>
          {EncoderOptionComponent ?
            <EncoderOptionComponent
              options={
                // Casting options, as encoderOptionsComponentMap[encodeData.type] ensures
                // the correct type, but typescript isn't smart enough.
                encoderState.options as any
              }
              onChange={onEncoderOptionsChange}
            />
          : null}
        </Expander>
      </div>
    );
  }
}
