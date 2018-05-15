import { h, Component } from 'preact';
import { bind } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';

type Props = {};

type State = {
  img?: ImageBitmap
};

export default class App extends Component<Props, State> {
  state: State = {};

  constructor() {
    super();
    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      this.componentDidUpdate = () => {
        window.STATE = this.state;
      };
    }
  }

  @bind
  async onFileChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || !fileInput.files[0]) return;
    // TODO: handle decode error
    const img = await createImageBitmap(fileInput.files[0]);
    this.setState({ img });
  }

  render({ }: Props, { img }: State) {
    return (
      <div id="app" class={style.app}>
        {img ?
          <Output img={img} />
          :
          <div>
            <h1>Select an image</h1>
            <input type="file" onChange={this.onFileChange} />
          </div>
        }
      </div>
    );
  }
}
