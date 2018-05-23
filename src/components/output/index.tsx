import { h, Component } from 'preact';
import PinchZoom from './custom-els/PinchZoom';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.scss';
import { bind } from '../../lib/util';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';

type Props = {
  sourceImg: ImageBitmap,
  img: ImageBitmap
};

type State = {};

export default class App extends Component<Props, State> {
  state: State = {};
  canvasLeft?: HTMLCanvasElement;
  canvasRight?: HTMLCanvasElement;
  pinchZoomLeft?: PinchZoom;
  pinchZoomRight?: PinchZoom;
  retargetedEvents = new WeakSet<Event>();

  updateCanvas(canvas: HTMLCanvasElement, img?: ImageBitmap) {
    let ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (img) ctx.drawImage(img, 0, 0);
  }

  updateCanvases(sourceImg?: ImageBitmap, img?: ImageBitmap) {
    if (this.canvasLeft) {
      this.updateCanvas(this.canvasLeft, sourceImg);
    }
    if (this.canvasRight) {
      this.updateCanvas(this.canvasRight, img);
    }
  }

  componentDidMount() {
    this.updateCanvases(this.props.sourceImg, this.props.img);
  }

  componentDidUpdate({ sourceImg, img }: Props) {
    if (sourceImg !== this.props.sourceImg || img !== this.props.img) {
      this.updateCanvases(this.props.sourceImg, this.props.img);
    }
  }

  @bind
  onPinchZoomLeftChange(event: Event) {
    if (!this.pinchZoomRight || !this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    this.pinchZoomRight.setTransform({
      scale: this.pinchZoomLeft.scale,
      x: this.pinchZoomLeft.x,
      y: this.pinchZoomLeft.y
    });
  }

  /**
   * We're using two pinch zoom elements, but we want them to stay in sync. When one moves, we
   * update the position of the other. However, this is tricky when it comes to multi-touch, when
   * one finger is on one pinch-zoom, and the other finger is on the other. To overcome this, we
   * redirect all relevant pointer/touch/mouse events to the first pinch zoom element.
   *
   * @param event Event to redirect
   */
  @bind
  onRetargetableEvent(event: Event) {
    const targetEl = event.target as HTMLElement;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    // If the event is on the handle of the two-up, let it through.
    if (targetEl.closest('.' + twoUpHandle)) return;
    // If we've already retargeted this event, let it through.
    if (this.retargetedEvents.has(event)) return;
    // Stop the event in its tracks.
    event.stopImmediatePropagation();
    event.preventDefault();
    // Clone the event & dispatch
    // Some TypeScript trickery needed due to https://github.com/Microsoft/TypeScript/issues/3841
    const clonedEvent = new (event.constructor as typeof Event)(event.type, event);
    this.retargetedEvents.add(clonedEvent);
    this.pinchZoomLeft.dispatchEvent(clonedEvent);
  }

  render({ sourceImg, img }: Props, { }: State) {
    return (
      <div>
        <two-up
          // Event redirecting. See onRetargetableEvent.
          onTouchStartCapture={this.onRetargetableEvent}
          onTouchEndCapture={this.onRetargetableEvent}
          onTouchMoveCapture={this.onRetargetableEvent}
          onPointerDownCapture={this.onRetargetableEvent}
          onMouseDownCapture={this.onRetargetableEvent}
          onWheelCapture={this.onRetargetableEvent}
        >
          <pinch-zoom onChange={this.onPinchZoomLeftChange} ref={p => this.pinchZoomLeft = p as PinchZoom}>
            <canvas class={style.outputCanvas} ref={c => this.canvasLeft = c as HTMLCanvasElement} width={img.width} height={img.height} />
          </pinch-zoom>
          <pinch-zoom ref={p => this.pinchZoomRight = p as PinchZoom}>
            <canvas class={style.outputCanvas} ref={c => this.canvasRight = c as HTMLCanvasElement} width={img.width} height={img.height} />
          </pinch-zoom>
        </two-up>
        <p>And that's all the app does so far!</p>
      </div>
    );
  }
}
