import { onScopeDispose, shallowRef, type Ref } from 'vue';

interface Point {
  clientX: number;
  clientY: number;
}

interface ApplyChangeOpts {
  panX?: number;
  panY?: number;
  scaleDiff?: number;
  originX?: number;
  originY?: number;
}

export interface SetTransformOpts {
  scale?: number;
  x?: number;
  y?: number;
}

export interface ScaleToOpts {
  /** Transform origin. Can be a number, or string percent, eg "50%" */
  originX?: number | string;
  /** Transform origin. Can be a number, or string percent, eg "50%" */
  originY?: number | string;
  /** Should the transform origin be relative to the container, or content? */
  relativeTo?: 'container' | 'content';
}

const MIN_SCALE = 0.01;
const MAX_SCALE = 100000;

function getDistance(a: Point, b?: Point): number {
  if (!b) return 0;
  return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
}

function getMidpoint(a: Point, b?: Point): Point {
  if (!b) return a;

  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
}

function getAbsoluteValue(value: string | number, max: number): number {
  if (typeof value === 'number') return value;

  if (value.trimEnd().endsWith('%')) {
    return (max * parseFloat(value)) / 100;
  }
  return parseFloat(value);
}

/**
 * Pan and zoom for content inside a container: one or two pointers to drag
 * and pinch, and the wheel (or trackpad pinch) to zoom. The content is
 * expected to be transformed with `translate(x, y) scale(scale)` around its
 * top-left corner. It can never be moved fully out of view.
 *
 * Pointers that start on an element matching `ignoreSelector` are left alone.
 */
export function usePanZoom(
  container: Readonly<Ref<HTMLElement | null>>,
  content: Readonly<Ref<HTMLElement | null>>,
  { ignoreSelector }: { ignoreSelector?: string } = {},
) {
  const x = shallowRef(0);
  const y = shallowRef(0);
  const scale = shallowRef(1);

  /** Update transform values without checking bounds. */
  function updateTransform(newScale: number, newX: number, newY: number) {
    // Avoid scaling to zero, or to very large values
    if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;
    scale.value = newScale;
    x.value = newX;
    y.value = newY;
  }

  /** Update the stage with a given scale/x/y. */
  function setTransform(opts: SetTransformOpts = {}) {
    const { scale: newScale = scale.value } = opts;
    let { x: newX = x.value, y: newY = y.value } = opts;

    const containerEl = container.value;
    const contentEl = content.value;

    // Without layout, just take the values. Bounds are checked next time.
    if (!containerEl || !contentEl) {
      updateTransform(newScale, newX, newY);
      return;
    }

    const containerBounds = containerEl.getBoundingClientRect();
    const contentBounds = contentEl.getBoundingClientRect();

    // Not displayed. May be disconnected or display:none.
    if (!containerBounds.width || !containerBounds.height) {
      updateTransform(newScale, newX, newY);
      return;
    }

    // Where the content would end up, relative to the container.
    const matrix = new DOMMatrix()
      .translate(newX, newY)
      .scale(newScale)
      // Undo current transform
      .multiply(
        new DOMMatrix([
          scale.value,
          0,
          0,
          scale.value,
          x.value,
          y.value,
        ]).inverse(),
      );

    const topLeft = new DOMPoint(
      contentBounds.left - containerBounds.left,
      contentBounds.top - containerBounds.top,
    ).matrixTransform(matrix);
    const bottomRight = new DOMPoint(
      contentBounds.right - containerBounds.left,
      contentBounds.bottom - containerBounds.top,
    ).matrixTransform(matrix);

    // Ensure the content can't move beyond out-of-bounds.
    if (topLeft.x > containerBounds.width) {
      newX += containerBounds.width - topLeft.x;
    } else if (bottomRight.x < 0) {
      newX += -bottomRight.x;
    }

    if (topLeft.y > containerBounds.height) {
      newY += containerBounds.height - topLeft.y;
    } else if (bottomRight.y < 0) {
      newY += -bottomRight.y;
    }

    updateTransform(newScale, newX, newY);
  }

  /** Transform the view by a pan and a scale about an origin. */
  function applyChange(opts: ApplyChangeOpts = {}) {
    const {
      panX = 0,
      panY = 0,
      originX = 0,
      originY = 0,
      scaleDiff = 1,
    } = opts;

    const matrix = new DOMMatrix()
      // Translate according to panning.
      .translate(panX, panY)
      // Scale about the origin.
      .translate(originX, originY)
      // Apply current translate
      .translate(x.value, y.value)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current scale.
      .scale(scale.value);

    // Convert the transform into basic translate & scale.
    setTransform({ scale: matrix.a, x: matrix.e, y: matrix.f });
  }

  /** Change the scale, adjusting x/y by a given transform origin. */
  function scaleTo(newScale: number, opts: ScaleToOpts = {}) {
    let { originX = 0, originY = 0 } = opts;
    const { relativeTo = 'content' } = opts;

    const contentEl = content.value;
    const relativeToEl = relativeTo === 'content' ? contentEl : container.value;

    // No content element? Fall back to just setting scale
    if (!relativeToEl || !contentEl) {
      setTransform({ scale: newScale });
      return;
    }

    const rect = relativeToEl.getBoundingClientRect();
    originX = getAbsoluteValue(originX, rect.width);
    originY = getAbsoluteValue(originY, rect.height);

    if (relativeTo === 'content') {
      originX += x.value;
      originY += y.value;
    } else {
      const contentRect = contentEl.getBoundingClientRect();
      originX += rect.left - contentRect.left;
      originY += rect.top - contentRect.top;
    }

    applyChange({ originX, originY, scaleDiff: newScale / scale.value });
  }

  function onPointersMove(previous: Point[], current: Point[]) {
    const contentEl = content.value;
    if (!contentEl) return;

    const contentRect = contentEl.getBoundingClientRect();

    // For calculating panning movement
    const prevMidpoint = getMidpoint(previous[0], previous[1]);
    const newMidpoint = getMidpoint(current[0], current[1]);

    // Calculate the desired change in scale
    const prevDistance = getDistance(previous[0], previous[1]);
    const newDistance = getDistance(current[0], current[1]);

    applyChange({
      // Midpoint within the element
      originX: prevMidpoint.clientX - contentRect.left,
      originY: prevMidpoint.clientY - contentRect.top,
      scaleDiff: prevDistance ? newDistance / prevDistance : 1,
      panX: newMidpoint.clientX - prevMidpoint.clientX,
      panY: newMidpoint.clientY - prevMidpoint.clientY,
    });
  }

  /** Active pointers, at most two. */
  const pointers = new Map<number, Point>();

  function onPointerDown(event: PointerEvent) {
    const containerEl = container.value!;
    if (pointers.size === 2 || !content.value) return;
    if (
      ignoreSelector &&
      event.target instanceof Element &&
      event.target.closest(ignoreSelector)
    ) {
      return;
    }
    event.preventDefault();
    containerEl.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, event);
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    const previous = [...pointers.values()];
    pointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    onPointersMove(previous, [...pointers.values()]);
  }

  function onPointerUp(event: PointerEvent) {
    if (!pointers.delete(event.pointerId)) return;

    // Unfocus any active element after a touch. This fixes an issue on (at
    // least) Android Chrome, where the software keyboard is hidden, but the
    // input remains focused, then after interaction with this element the
    // keyboard reappears for NO GOOD REASON. Thanks Android.
    if (
      event.pointerType === 'touch' &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  }

  function onWheel(event: WheelEvent) {
    const contentEl = content.value;
    if (!contentEl) return;
    event.preventDefault();

    const contentRect = contentEl.getBoundingClientRect();
    let { deltaY } = event;
    const { ctrlKey, deltaMode } = event;

    if (deltaMode === 1) {
      // 1 is "lines", 0 is "pixels"
      // Firefox uses "lines" for some types of mouse
      deltaY *= 15;
    }

    const zoomingOut = deltaY > 0;

    // ctrlKey is true when pinch-zooming on a trackpad.
    const divisor = ctrlKey ? 100 : 300;
    // when zooming out, invert the delta and the ratio to keep zoom stable
    const ratio = 1 - (zoomingOut ? -deltaY : deltaY) / divisor;
    const scaleDiff = zoomingOut ? 1 / ratio : ratio;

    applyChange({
      scaleDiff,
      originX: event.clientX - contentRect.left,
      originY: event.clientY - contentRect.top,
    });
  }

  const listeners = {
    pointerdown: onPointerDown,
    pointermove: onPointerMove,
    pointerup: onPointerUp,
    pointercancel: onPointerUp,
    wheel: onWheel,
  } as const;

  let listeningOn: HTMLElement | undefined;

  /** Starts listening on the container. Call once it's mounted. */
  function attach() {
    detach();
    listeningOn = container.value ?? undefined;
    if (!listeningOn) return;
    for (const [type, listener] of Object.entries(listeners)) {
      // Not passive, as wheel and pointerdown call preventDefault.
      listeningOn.addEventListener(type, listener as EventListener, {
        passive: false,
      });
    }
  }

  function detach() {
    if (!listeningOn) return;
    for (const [type, listener] of Object.entries(listeners)) {
      listeningOn.removeEventListener(type, listener as EventListener);
    }
    listeningOn = undefined;
    pointers.clear();
  }

  onScopeDispose(detach);

  return { x, y, scale, setTransform, scaleTo, attach };
}
