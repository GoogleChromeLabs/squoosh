import { h, Component } from 'preact';

import * as style from './style.scss';
import { bind, Fileish } from '../../lib/initial-util';
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
import FileSize from '../FileSize';
import { DownloadIcon } from '../../lib/icons';
import { SourceImage } from '../App';
import Checkbox from '../checkbox';
import Expander from '../expander';
import Select from '../select';

const encoderOptionsComponentMap = {
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
  orientation: 'horizontal' | 'vertical';
  source?: SourceImage;
  imageIndex: number;
  imageFile?: Fileish;
  downloadUrl?: string;
  encoderState: EncoderState;
  preprocessorState: PreprocessorState;
  onEncoderTypeChange(newType: EncoderType): void;
  onEncoderOptionsChange(newOptions: EncoderOptions): void;
  onPreprocessorOptionsChange(newOptions: PreprocessorState): void;
  onCopyToOtherClick(): void;
}

interface State {
  encoderSupportMap?: EncoderSupportMap;
}

export default class Options extends Component<Props, State> {
  typeSelect?: HTMLSelectElement;

  constructor() {
    super();
    encodersSupported.then(encoderSupportMap => this.setState({ encoderSupportMap }));
  }

  @bind
  onEncoderTypeChange(event: Event) {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as EncoderType;
    this.props.onEncoderTypeChange(type);
  }

  @bind
  onPreprocessorEnabledChange(event: Event) {
    const el = event.currentTarget as HTMLInputElement;
    const preprocessor = el.name.split('.')[0] as keyof PreprocessorState;

    this.props.onPreprocessorOptionsChange(
      cleanSet(this.props.preprocessorState, `${preprocessor}.enabled`, el.checked),
    );
  }

  @bind
  onQuantizerOptionsChange(opts: QuantizeOptions) {
    this.props.onPreprocessorOptionsChange(
      cleanMerge(this.props.preprocessorState, 'quantizer', opts),
    );
  }

  @bind
  onResizeOptionsChange(opts: ResizeOptions) {
    this.props.onPreprocessorOptionsChange(
      cleanMerge(this.props.preprocessorState, 'resize', opts),
    );
  }

  @bind
  onCopyToOtherClick(event: Event) {
    event.preventDefault();
    this.props.onCopyToOtherClick();
  }

  render(
    {
      source,
      imageIndex,
      imageFile,
      downloadUrl,
      orientation,
      encoderState,
      preprocessorState,
      onEncoderOptionsChange,
    }: Props,
    { encoderSupportMap }: State,
  ) {
    // tslint:disable variable-name
    const EncoderOptionComponent = encoderOptionsComponentMap[encoderState.type];

    return (
      <div class={style.options}>
        <Expander>
          {encoderState.type === identity.type ? null :
            <div>
              <h2 class={style.optionsTitle}>Edit</h2>
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
                    aspect={source ? (source.data.width / source.data.height) : 1}
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

        <h2 class={style.optionsTitle}>Compress</h2>

        <div class={style.optionsScroller}>
          <section class={`${style.optionOneCell} ${style.optionsSection}`}>
            {encoderSupportMap ?
              <Select value={encoderState.type} onChange={this.onEncoderTypeChange} large>
                {encoders.filter(encoder => encoderSupportMap[encoder.type]).map(encoder => (
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

        {/*

        <div class={style.row}>
          <button onClick={this.onCopyToOtherClick}>Copy settings to other side</button>
        </div>

        <div class={style.sizeDetails}>
          <FileSize
            class={style.size}
            increaseClass={style.increase}
            decreaseClass={style.decrease}
            file={imageFile}
            compareTo={(source && imageFile !== source.file) ? source.file : undefined}
          />

          {(downloadUrl && imageFile) && (
            <a
              class={style.download}
              href={downloadUrl}
              download={imageFile.name}
              title="Download"
            >
              <DownloadIcon />
            </a>
          )}
        </div>
        */}
      </div>
    );
  }
}
