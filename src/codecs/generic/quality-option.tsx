import { h, Component } from 'preact';
import { bind } from '../../lib/initial-util';
import * as style from '../../components/Options/style.scss';
import Range from '../../components/range';

interface EncodeOptions {
  quality: number;
}

type Props = {
  options: EncodeOptions,
  onChange(newOptions: EncodeOptions): void,
};

interface QualityOptionArg {
  min?: number;
  max?: number;
  step?: number;
}

export default function qualityOption(opts: QualityOptionArg = {}) {
  const {
    min = 0,
    max = 100,
    step = 1,
  } = opts;

  class QualityOptions extends Component<Props, {}> {
    @bind
    onChange(event: Event) {
      const el = event.currentTarget as HTMLInputElement;
      this.props.onChange({ quality: Number(el.value) });
    }

    render({ options }: Props) {
      return (
        <div class={style.optionsSection}>
          <div class={style.optionOneCell}>
            <Range
              name="quality"
              min={min}
              max={max}
              step={step || 'any'}
              value={options.quality}
              onInput={this.onChange}
            >
              Quality:
            </Range>
          </div>
        </div>
      );
    }
  }

  return QualityOptions;
}
