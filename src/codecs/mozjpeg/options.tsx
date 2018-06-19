import { h } from 'preact';
import { CodecOptions } from '../../components/app';

type Props = {
  options: CodecOptions,
  updateOption(e: Event): void,
  setOption(key: string, value: any): void
};

const MozJpegCodecOptions = ({ options, updateOption }: Props) => (
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
        onInput={updateOption}
      />
    </label>
  </div>
);

export default MozJpegCodecOptions;
