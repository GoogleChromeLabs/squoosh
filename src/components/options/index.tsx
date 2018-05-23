import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';

type CodecOptions = any;

type Props = {
    options: CodecOptions,
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
    updateOption(e: Event) {
        const el = e.currentTarget as HTMLInputElement;
        const options = Object.assign({}, this.state.options);
        options[el.name] = /(rad|box)/i.test(el.type) ? el.checked : el.value;
        this.setState({ options });
        this.props.onOptionsChange(options);
    }

    render({ }: Props, { options }: State) {
        return (
            <div class={style.options}>
                <h2>Options</h2>
                <label>
                    Quality:
                    <input
                        name="quality" type="range"
                        min="1" max="100" step="1"
                        value={options.quality}
                        onInput={this.updateOption}
                    />
                </label>
                <pre>{JSON.stringify(options,null,2)}</pre>
            </div>
        );
    }
}
