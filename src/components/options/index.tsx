import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import { ImageType, CodecOptions } from '../app';

const CodecConfigurations: {
  [type: string]: (props: ChildProps) => JSX.Element | null
} = {
  original: () => null
};

type ChildProps = {
  options: CodecOptions,
  updateOption(e: Event): void,
  setOption(key: string, value: any): void
};

CodecConfigurations.jpeg = ({ options, updateOption }: ChildProps) => (
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

type Props = {
  name: string,
  class?: string,
  type: ImageType,
  options: CodecOptions,
  onTypeChange(type: string): void,
  onOptionsChange(options: any): void
};

type State = {
  options: CodecOptions
};

export default class Options extends Component<Props, State> {
  state = {
    options: this.props.options || {}
  };

  componentWillReceiveProps({ options }: Props) {
    if (options !== this.props.options) {
      this.setState({ options });
    }
  }

  @bind
    setType(e: Event) {
    const el = e.currentTarget as HTMLSelectElement;
    this.props.onTypeChange(el.value);
  }

  @bind
    updateOption(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    this.setOption(el.name, /(rad|box)/i.test(el.type) ? el.checked : el.value);
  }

  @bind
    setOption(key: string, value?: any) {
    const options = Object.assign({}, this.state.options);
    options[key] = value;
    this.setState({ options });
    this.props.onOptionsChange(options);
  }

  render({ class: c, name, type }: Props, { options }: State) {
    const CodecOptionComponent = CodecConfigurations[type];

    return (
            <div class={`${style.options}${c ? (' ' + c) : ''}`}>
                <label>
                    Mode:
                    <select value={type} onChange={this.setType}>
                        <option value="original">Original</option>
                        <option value="jpeg">JPEG</option>
                    </select>
                </label>
                {CodecOptionComponent && (
                    <CodecOptionComponent
                        options={options}
                        setOption={this.setOption}
                        updateOption={this.updateOption}
                    />
                )}
                {/* <pre>{JSON.stringify(options,null,2)}</pre> */}
            </div>
    );
  }
}
