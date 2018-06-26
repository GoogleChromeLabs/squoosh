import { h } from 'preact';
import { CodecOptions } from '../../components/app';

type Props = {
  options: CodecOptions,
  onChange(e: Event): void,
  setOption(key: string, value: any): void
};

const MozJpegCodecOptions = ({ options, onChange }: Props) => (
  <div>
    <label>
      Quality:
      <input
        name="quality"
        type="range"
        min="1"
        max="100"
        step="1"
        value={options.quality}
        onInput={onChange}
      />
    </label>
  </div>
);

export default MozJpegCodecOptions;
