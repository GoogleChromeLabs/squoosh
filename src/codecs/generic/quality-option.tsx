import { h, Component } from 'preact';
import { bind } from '../../lib/util';
import '../../custom-els/RangeInput';

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
        <div>
          <label>
            Quality:
            <range-input
              name="quality"
              min={min}
              max={max}
              step={step || 'any'}
              value={'' + options.quality}
              onChange={this.onChange}
            />
          </label>
        </div>
      );
    }
  }

  return QualityOptions;
}
