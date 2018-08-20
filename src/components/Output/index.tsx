import { h, Component } from 'preact';
import PinchZoom from './custom-els/PinchZoom';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.scss';
import { bind, shallowEqual, drawBitmapToCanvas, linkRef } from '../../lib/util';
import { ToggleIcon, AddIcon, RemoveIcon } from '../../lib/icons';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';

interface Props {
  orientation: 'horizontal' | 'vertical';
  leftImg: ImageBitmap;
  rightImg: ImageBitmap;
}

interface State {
  scale: number;
  editingScale: boolean;
  altBackground: boolean;
}

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
    if (this.canvasLeft) {
      drawBitmapToCanvas(this.canvasLeft, this.props.leftImg);
    }
    if (this.canvasRight) {
      drawBitmapToCanvas(this.canvasRight, this.props.rightImg);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.leftImg !== this.props.leftImg && this.canvasLeft) {
      drawBitmapToCanvas(this.canvasLeft, this.props.leftImg);
    }
    if (prevProps.rightImg !== this.props.rightImg && this.canvasRight) {
      drawBitmapToCanvas(this.canvasRight, this.props.rightImg);
    }

    const { scale } = this.state;
    if (scale !== prevState.scale && this.pinchZoomLeft && this.pinchZoomRight) {
      // @TODO it would be nice if PinchZoom exposed a variant of setTransform() that
      // preserved translation. It currently only does this for mouse wheel events.
      this.pinchZoomLeft.setTransform({ scale });
      this.pinchZoomRight.setTransform({ scale });
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }

  @bind
  toggleBackground() {
    this.setState({
      altBackground: !this.state.altBackground,
    });
  }

  @bind
  zoomIn() {
    this.setState({
      scale: Math.min(this.state.scale * 1.25, 100),
    });
  }

  @bind
  zoomOut() {
    this.setState({
      scale: Math.max(this.state.scale / 1.25, 0.0001),
    });
  }

  @bind
  editScale() {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput) this.scaleInput.focus();
    });
  }

  @bind
  cancelEditScale() {
    this.setState({ editingScale: false });
  }

  @bind
  onScaleInputChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const percent = parseFloat(target.value);
    if (isNaN(percent)) return;
    this.setState({
      scale: percent / 100,
    });
  }

  @bind
  onPinchZoomLeftChange(event: Event) {
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
  onRetargetableEvent(event: Event) {
    const targetEl = event.target as HTMLElement;
    if (!this.pinchZoomLeft) throw Error('Missing pinch-zoom element');
    // If the event is on the handle of the two-up, let it through,
    // unless it's a wheel event, in which case always let it through.
    if (event.type !== 'wheel' && targetEl.closest('.' + twoUpHandle)) return;
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
    { orientation, leftImg, rightImg }: Props,
    { scale, editingScale, altBackground }: State,
  ) {
    return (
      <div class={`${style.output} ${altBackground ? style.altBackground : ''}`}>
        <two-up
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
            tabIndex={-1}
            onChange={this.onPinchZoomLeftChange}
            ref={linkRef(this, 'pinchZoomLeft')}
          >
            <canvas
              class={style.outputCanvas}
              ref={linkRef(this, 'canvasLeft')}
              width={leftImg.width}
              height={leftImg.height}
            />
          </pinch-zoom>
          <pinch-zoom ref={linkRef(this, 'pinchZoomRight')}>
            <canvas
              class={style.outputCanvas}
              ref={linkRef(this, 'canvasRight')}
              width={rightImg.width}
              height={rightImg.height}
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
