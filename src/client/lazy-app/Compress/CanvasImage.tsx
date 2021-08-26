import { h, Component, createRef } from 'preact';
import { drawDataToCanvas } from '../util/canvas';

export interface CanvasImageProps
  extends h.JSX.HTMLAttributes<HTMLCanvasElement> {
  image?: ImageData;
}

export default class CanvasImage extends Component<CanvasImageProps> {
  canvas = createRef<HTMLCanvasElement>();
  componentDidUpdate(prevProps: CanvasImageProps) {
    if (this.props.image !== prevProps.image) {
      this.draw(this.props.image);
    }
  }
  componentDidMount() {
    if (this.props.image) {
      this.draw(this.props.image);
    }
  }
  draw(image?: ImageData) {
    const canvas = this.canvas.current;
    if (!canvas) return;
    if (!image) canvas.getContext('2d');
    else drawDataToCanvas(canvas, image);
  }
  render({ image, ...props }: CanvasImageProps) {
    return (
      <canvas
        ref={this.canvas}
        width={image?.width}
        height={image?.height}
        {...props}
      />
    );
  }
}
