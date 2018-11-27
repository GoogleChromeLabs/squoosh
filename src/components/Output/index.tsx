import { h, Component } from 'preact';
import PinchZoom, { ScaleToOpts } from './custom-els/PinchZoom';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.scss';
import { bind, linkRef } from '../../lib/initial-util';
import { shallowEqual, drawDataToCanvas } from '../../lib/util';
import { ToggleIcon, AddIcon, RemoveIcon, BackIcon } from '../../lib/icons';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';

interface Props {
  originalImage?: ImageData;
  mobileView: boolean;
  leftCompressed?: ImageData;
  rightCompressed?: ImageData;
  leftImgContain: boolean;
  rightImgContain: boolean;
  leftFlipDimensions: boolean;
  rightFlipDimensions: boolean;
  onBack: () => void;
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

    // Reset the pinch zoom, which may have an position set from the previous view, after pressing
    // the back button.
    this.pinchZoomLeft!.setTransform({
      allowChangeEvent: true,
      x: 0,
      y: 0,
      scale: 1,
    });

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
  private onScaleValueFocus() {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput) {
        // Firefox unfocuses the input straight away unless I force a style calculation here. I have
        // no idea why, but it's late and I'm quite tired.
        getComputedStyle(this.scaleInput).transform;
        this.scaleInput.focus();
      }
    });
  }

  @bind
  private onScaleInputBlur() {
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

    // Unfocus any active element on touchend. This fixes an issue on (at least) Android Chrome,
    // where the software keyboard is hidden, but the input remains focused, then after interaction
    // with this element the keyboard reappears for NO GOOD REASON. Thanks Android.
    if (
      event.type === 'touchend' &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  }

  render(
    {
      mobileView, leftImgContain, rightImgContain, leftFlipDimensions, rightFlipDimensions,
      originalImage, onBack,
    }: Props,
    { scale, editingScale, altBackground }: State,
  ) {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();
    // To keep position stable, the output is put in a square using the longest dimension.
    const maxDimension = originalImage && Math.max(originalImage.width, originalImage.height);
    const pinchTargetStyle = {
      width: maxDimension,
      height: maxDimension,
    };

    return (
      <div class={`${style.output} ${altBackground ? style.altBackground : ''}`}>
        <two-up
          legacy-clip-compat
          class={style.twoUp}
          orientation={mobileView ? 'vertical' : 'horizontal'}
          // Event redirecting. See onRetargetableEvent.
          onTouchStartCapture={this.onRetargetableEvent}
          onTouchEndCapture={this.onRetargetableEvent}
          onTouchMoveCapture={this.onRetargetableEvent}
          onPointerDownCapture={this.onRetargetableEvent}
          onMouseDownCapture={this.onRetargetableEvent}
          onWheelCapture={this.onRetargetableEvent}
        >
          <pinch-zoom
            class={style.pinchZoom}
            onChange={this.onPinchZoomLeftChange}
            ref={linkRef(this, 'pinchZoomLeft')}
          >
            <div class={style.pinchTarget} style={pinchTargetStyle}>
              <canvas
                ref={linkRef(this, 'canvasLeft')}
                width={leftDraw && leftDraw.width}
                height={leftDraw && leftDraw.height}
                style={{
                  width: originalImage &&
                    (leftFlipDimensions ? originalImage.height : originalImage.width),
                  height: originalImage &&
                    (leftFlipDimensions ? originalImage.width : originalImage.height),
                  objectFit: leftImgContain ? 'contain' : '',
                }}
              />
            </div>
          </pinch-zoom>
          <pinch-zoom class={style.pinchZoom} ref={linkRef(this, 'pinchZoomRight')}>
            <div class={style.pinchTarget} style={pinchTargetStyle}>
              <canvas
                ref={linkRef(this, 'canvasRight')}
                width={rightDraw && rightDraw.width}
                height={rightDraw && rightDraw.height}
                style={{
                  width: originalImage &&
                    (rightFlipDimensions ? originalImage.height : originalImage.width),
                  height: originalImage &&
                    (rightFlipDimensions ? originalImage.width : originalImage.height),
                  objectFit: rightImgContain ? 'contain' : '',
                }}
              />
            </div>
          </pinch-zoom>
        </two-up>

        <div class={style.back}>
          <button class={style.button} onClick={onBack}>
            <BackIcon />
          </button>
        </div>

        <div class={style.controls}>
          <div class={style.zoomControls}>
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
                onBlur={this.onScaleInputBlur}
              />
            ) : (
              <span class={style.zoom} tabIndex={0} onFocus={this.onScaleValueFocus}>
                <span class={style.zoomValue}>{Math.round(scale * 100)}</span>
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
