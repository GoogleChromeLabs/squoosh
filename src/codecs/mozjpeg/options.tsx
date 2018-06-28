import { h, Component } from 'preact';
import { EncodeOptions } from './encoder';
import { bind } from '../../lib/util';

type Props = {
  options: EncodeOptions,
  onChange(newOptions: EncodeOptions): void
};

export default class MozJpegCodecOptions extends Component<Props, {}> {
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
          <input
            name="quality"
            type="range"
            min="1"
            max="100"
            step="1"
            value={'' + options.quality}
            onChange={this.onChange}
          />
        </label>
      </div>
    );
  }
}
