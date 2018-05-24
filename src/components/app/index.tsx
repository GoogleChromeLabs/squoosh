import { h, Component } from 'preact';
import { bind, bitmapToImageData } from '../../lib/util';
import * as style from './style.scss';
import Output from '../output';
import Options from '../options';

import {MozJpegEncoder} from '../../lib/codec-wrappers/mozjpeg-enc';

type Props = {};

type State = {
  sourceImg?: ImageBitmap,
  sourceData?: ImageData,
  img?: ImageBitmap,
  loading: boolean
  options: any
};

export default class App extends Component<Props, State> {
  state: State = {
    loading: false,
    options: {}
  };

  optionsUpdateTimer?: NodeJS.Timer | number | null;

  compressCounter = 0;

  retries = 0;

  encoders = {
    jpeg: new MozJpegEncoder()
  };

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
  setOptions(options: any) {
    this.setState({ options });
    if (!this.optionsUpdateTimer) {
      this.optionsUpdateTimer = setTimeout(this.optionsUpdated, 500);
    }
  }

  @bind
  optionsUpdated() {
    this.optionsUpdateTimer = null;
    if (this.state.sourceData) {
      this.updateCompressedImage(this.state.sourceData);
    }
  }

  @bind
  async onFileChange(event: Event) {
    this.setState({ loading: true });
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || !fileInput.files[0]) return;
    // TODO: handle decode error
    const bitmap = await createImageBitmap(fileInput.files[0]);
    // compute the corresponding ImageData once since it only changes when the file changes:
    const sourceData = await bitmapToImageData(bitmap);
    this.setState({ sourceImg: bitmap, sourceData, loading: false });
    this.updateCompressedImage(sourceData);
  }

  async updateCompressedImage(sourceData: ImageData) {
    const id = ++this.compressCounter;
    this.setState({ loading: true });
    try {
      const compressedData = await this.encoders.jpeg.encode(sourceData, this.state.options);
      const blob = new Blob([compressedData], {type: 'image/jpeg'});
      const compressedImage = await createImageBitmap(blob);
      // if another compression started, ignore this one
      if (this.compressCounter!==id) return;
      this.retries = 0;
      this.setState({ img: compressedImage, loading: false });
    } catch (err) {
      if (this.compressCounter===id && ++this.retries<10) {
        this.updateCompressedImage(sourceData);
      }
    }
  }

  render({ }: Props, { loading, options, sourceImg, img }: State) {
    return (
      <div id="app" class={style.app}>
        {sourceImg && img ? (
          <Output sourceImg={sourceImg} img={img} />
        ) : (
          <div>
            <h1>Select an image</h1>
            <input type="file" onChange={this.onFileChange} />
          </div>
        )}
        <Options options={options} onOptionsChange={this.setOptions} />
      </div>
    );
  }
}

