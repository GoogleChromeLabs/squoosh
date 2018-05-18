// PRs to fix this:
// https://github.com/developit/preact/pull/1101
// https://github.com/developit/preact/pull/1102
declare namespace JSX {
  type PointerEventHandler = EventHandler<PointerEvent>;

  interface DOMAttributes {
    onTouchStartCapture?: TouchEventHandler;
    onTouchEndCapture?: TouchEventHandler;
    onTouchMoveCapture?: TouchEventHandler;

    onPointerDownCapture?: PointerEventHandler;

    onMouseDownCapture?: MouseEventHandler;

    onWheelCapture?: WheelEventHandler;
  }
}

interface CanvasRenderingContext2D {
  filter: string;
}
