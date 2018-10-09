import { h, Component } from 'preact';
import * as style from './style.scss';
import { bind } from '../../lib/util';

interface Props {
  onFile: (file: File) => void;
}
interface State {}

export default class Intro extends Component<Props, State> {
  @bind
  onFileChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.props.onFile(file);
  }

  render({ }: Props, { }: State) {
    return (
      <div class={style.welcome}>
        <h1>Drop, paste or select an image</h1>
        <input type="file" onChange={this.onFileChange} />
      </div>
    );
  }
}
