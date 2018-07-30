import { h, Component } from 'preact';
import { bind } from '../../lib/util';
// import * as styles from './styles.scss';
import { QuantizeOptions } from './quantizer';

type Props = {
  options: QuantizeOptions,
  onChange(newOptions: QuantizeOptions): void,
};

/**
 * @param field An HTMLInputElement, but the casting is done here to tidy up onChange.
 */
function fieldValueAsNumber(field: any): number {
  return Number((field as HTMLInputElement).value);
}

export default class QuantizerOptions extends Component<Props, {}> {
  @bind
  onChange(event: Event) {
    const form = (event.currentTarget as HTMLInputElement).closest('form') as HTMLFormElement;

    const options: QuantizeOptions = {
      maxNumColors: fieldValueAsNumber(form.maxNumColors),
      dither: fieldValueAsNumber(form.dither),
    };
    this.props.onChange(options);
  }

  render({ options }: Props) {
    return (
      <form>
        <label>
          Pallette Color:
          <input
            name="maxNumColors"
            type="range"
            min="2"
            max="256"
            value={'' + options.maxNumColors}
            onChange={this.onChange}
          />
        </label>
        <label>
          Dithering:
          <input
            name="dither"
            type="range"
            min="0"
            max="1"
            value={'' + options.dither}
            onChange={this.onChange}
          />
        </label>
      </form>
    );
  }
}
