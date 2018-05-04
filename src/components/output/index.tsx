import { h, Component } from 'preact';
import './custom-els/PinchZoom';
import * as style from './style.scss';

type Props = {
  img: ImageBitmap
};

type State = {};

export default class App extends Component<Props, State> {
  state: State = {};
  canvas?: HTMLCanvasElement;

  constructor() {
    super();
  }

  updateCanvas(img: ImageBitmap) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(img, 0, 0);
  }

  componentDidMount() {
    this.updateCanvas(this.props.img);
  }

  componentDidUpdate({ img }: Props) {
    if (img !== this.props.img) this.updateCanvas(this.props.img);
  }

  render({ img }: Props, { }: State) {
    return (
      <div>
        <pinch-zoom>
          <canvas class={style.outputCanvas} ref={c => this.canvas = c as HTMLCanvasElement} width={img.width} height={img.height} />
        </pinch-zoom>
        <p>And that's all the app does so far!</p>
      </div>
    );
  }
}
