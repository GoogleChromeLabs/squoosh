import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';

import {MozJpegEncoder} from '../../lib/codec-wrappers/mozjpeg-enc';

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
    const bitmap = await createImageBitmap(fileInput.files[0]);
    const data = await bitmapToImageData(bitmap);
    const encoder = new MozJpegEncoder();
    const compressedData = await encoder.encode(data);
    const blob = new Blob([compressedData], {type: 'image/jpeg'});
    const compressedImage = await createImageBitmap(blob);
    this.setState({ img: compressedImage });
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

