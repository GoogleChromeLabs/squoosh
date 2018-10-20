import { h, Component } from 'preact';
import PinchZoom, { ScaleToOpts } from './custom-els/PinchZoom';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.scss';
import { bind, linkRef } from '../../lib/initial-util';
import { shallowEqual, drawDataToCanvas } from '../../lib/util';
import { ToggleIcon, AddIcon, RemoveIcon } from '../../lib/icons';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';

interface Props {
  originalImage?: ImageData;
  orientation: 'horizontal' | 'vertical';
  leftCompressed?: ImageData;
  rightCompressed?: ImageData;
  leftImgContain: boolean;
  rightImgContain: boolean;
}

interface State {
  scale: number;
  editingScale: boolean;
  altBackground: boolean;
}

const scaleToOpts: ScaleToOpts = {
  originX: '50%',
  originY: '50%',
  relativeTo: 'container',
  allowChangeEvent: true,
};

export default class Output extends Component<Props, State> {
  state: State = {
    scale: 1,
    editingScale: false,
    altBackground: false,
  };
  canvasLeft?: HTMLCanvasElement;
  canvasRight?: HTMLCanvasElement;
  pinchZoomLeft?: PinchZoom;
  pinchZoomRight?: PinchZoom;
  scaleInput?: HTMLInputElement;
  retargetedEvents = new WeakSet<Event>();

  componentDidMount() {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();

    if (this.canvasLeft && leftDraw) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
    }
    if (this.canvasRight && rightDraw) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const prevLeftDraw = this.leftDrawable(prevProps);
    const prevRightDraw = this.rightDrawable(prevProps);
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();

    if (leftDraw && leftDraw !== prevLeftDraw && this.canvasLeft) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
    }
    if (rightDraw && rightDraw !== prevRightDraw && this.canvasRight) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }

    if (this.props.originalImage !== prevProps.originalImage && this.pinchZoomLeft) {
      // New image? Reset the pinch-zoom.
      this.pinchZoomLeft.setTransform({
        allowChangeEvent: true,
        x: 0,
        y: 0,
        scale: 1,
      });
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }

  private leftDrawable(props: Props = this.props): ImageData | undefined {
    return props.leftCompressed || props.originalImage;
  }

  private rightDrawable(props: Props = this.props): ImageData | undefined {
    return props.rightCompressed || props.originalImage;
  }

  @bind
  private toggleBackground() {
    this.setState({
      altBackground: !this.state.altBackground,
    });
  }

  @bind
  private zoomIn() {
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');

    this.pinchZoomLeft.scaleTo(this.state.scale * 1.25, scaleToOpts);
  }

  @bind
  private zoomOut() {
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');

    this.pinchZoomLeft.scaleTo(this.state.scale / 1.25, scaleToOpts);
  }

  @bind
  private editScale() {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput) this.scaleInput.focus();
    });
  }

  @bind
  private cancelEditScale() {
    this.setState({ editingScale: false });
  }

  @bind
  private onScaleInputChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const percent = parseFloat(target.value);
    if (isNaN(percent)) return;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');

    this.pinchZoomLeft.scaleTo(percent / 100, scaleToOpts);
  }

  @bind
  private onPinchZoomLeftChange(event: Event) {
    if (!this.pinchZoomRight || !this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    this.setState({
      scale: this.pinchZoomLeft.scale,
    });
    this.pinchZoomRight.setTransform({
      scale: this.pinchZoomLeft.scale,
      x: this.pinchZoomLeft.x,
      y: this.pinchZoomLeft.y,
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
  private onRetargetableEvent(event: Event) {
    const targetEl = event.target as HTMLElement;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    // If the event is on the handle of the two-up, let it through,
    // unless it's a wheel event, in which case always let it through.
    if (event.type !== 'wheel' && targetEl.closest(`.${twoUpHandle}`)) return;
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

  render(
    {
      orientation, leftCompressed, rightCompressed, leftImgContain, rightImgContain,
      originalImage,
    }: Props,
    { scale, editingScale, altBackground }: State,
  ) {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();

    return (
      <div class={`${style.output} ${altBackground ? style.altBackground : ''}`}>
        <two-up
          legacy-clip-compat
          orientation={orientation}
          // Event redirecting. See onRetargetableEvent.
          onTouchStartCapture={this.onRetargetableEvent}
          onTouchEndCapture={this.onRetargetableEvent}
          onTouchMoveCapture={this.onRetargetableEvent}
          onPointerDownCapture={this.onRetargetableEvent}
          onMouseDownCapture={this.onRetargetableEvent}
          onWheelCapture={this.onRetargetableEvent}
        >
          <pinch-zoom
            onChange={this.onPinchZoomLeftChange}
            ref={linkRef(this, 'pinchZoomLeft')}
          >
            <canvas
              class={style.outputCanvas}
              ref={linkRef(this, 'canvasLeft')}
              width={leftDraw && leftDraw.width}
              height={leftDraw && leftDraw.height}
              style={{
                width: originalImage && originalImage.width,
                height: originalImage && originalImage.height,
                objectFit: leftImgContain ? 'contain' : '',
              }}
            />
          </pinch-zoom>
          <pinch-zoom ref={linkRef(this, 'pinchZoomRight')}>
            <canvas
              class={style.outputCanvas}
              ref={linkRef(this, 'canvasRight')}
              width={rightDraw && rightDraw.width}
              height={rightDraw && rightDraw.height}
              style={{
                width: originalImage && originalImage.width,
                height: originalImage && originalImage.height,
                objectFit: rightImgContain ? 'contain' : '',
              }}
            />
          </pinch-zoom>
        </two-up>

        <div class={style.controls}>
          <div class={style.group}>
            <button class={style.button} onClick={this.zoomOut}>
              <RemoveIcon />
            </button>
            {editingScale ? (
              <input
                type="number"
                step="1"
                min="1"
                max="1000000"
                ref={linkRef(this, 'scaleInput')}
                class={style.zoom}
                value={Math.round(scale * 100)}
                onInput={this.onScaleInputChanged}
                onBlur={this.cancelEditScale}
              />
            ) : (
              <span class={style.zoom} tabIndex={0} onFocus={this.editScale}>
                <strong>{Math.round(scale * 100)}</strong>
                %
              </span>
            )}
            <button class={style.button} onClick={this.zoomIn}>
              <AddIcon />
            </button>
          </div>
          <button class={style.button} onClick={this.toggleBackground}>
            <ToggleIcon />
            Toggle Background
          </button>
        </div>
      </div>
    );
  }
}
