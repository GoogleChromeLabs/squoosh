// PRs to fix this:
// https://github.com/developit/preact/pull/1101
// https://github.com/developit/preact/pull/1102
declare namespace JSX {
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

// Handling file-loader imports:
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
