import PointerTracker, { Pointer } from 'pointer-tracker';
import 'add-css:./styles.css';
import { isSafari } from 'client/lazy-app/util';

interface Point {
  clientX: number;
  clientY: number;
}

interface ChangeOptions {
  /**
   * Fire a 'change' event if values are different to current values
   */
  allowChangeEvent?: boolean;
}

interface ApplyChangeOpts extends ChangeOptions {
  panX?: number;
  panY?: number;
  scaleDiff?: number;
  originX?: number;
  originY?: number;
}

interface SetTransformOpts extends ChangeOptions {
  scale?: number;
  x?: number;
  y?: number;
}

type ScaleRelativeToValues = 'container' | 'content';

export interface ScaleToOpts extends ChangeOptions {
  /** Transform origin. Can be a number, or string percent, eg "50%" */
  originX?: number | string;
  /** Transform origin. Can be a number, or string percent, eg "50%" */
  originY?: number | string;
  /** Should the transform origin be relative to the container, or content? */
  relativeTo?: ScaleRelativeToValues;
}

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

  if (value.trimRight().endsWith('%')) {
    return (max * parseFloat(value)) / 100;
  }
  return parseFloat(value);
}

// I'd rather use DOMMatrix/DOMPoint here, but the browser support isn't good enough.
// Given that, better to use something everything supports.
let cachedSvg: SVGSVGElement;

function getSVG(): SVGSVGElement {
  return (
    cachedSvg ||
    (cachedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
  );
}

function createMatrix(): SVGMatrix {
  return getSVG().createSVGMatrix();
}

function createPoint(): SVGPoint {
  return getSVG().createSVGPoint();
}

const MIN_SCALE = 0.01;
const MAX_SCALE = 100000;

export default class PinchZoom extends HTMLElement {
  // The element that we'll transform.
  // Ideally this would be shadow DOM, but we don't have the browser
  // support yet.
  private _positioningEl?: Element;
  // Current transform.
  private _transform: SVGMatrix = createMatrix();

  constructor() {
    super();

    // Watch for children changes.
    // Note this won't fire for initial contents,
    // so _stageElChange is also called in connectedCallback.
    new MutationObserver(() => this._stageElChange()).observe(this, {
      childList: true,
    });

    // Watch for pointers
    const pointerTracker: PointerTracker = new PointerTracker(this, {
      start: (pointer, event) => {
        // We only want to track 2 pointers at most
        if (
          pointerTracker.currentPointers.length === 2 ||
          !this._positioningEl
        ) {
          return false;
        }
        event.preventDefault();
        return true;
      },
      move: (previousPointers) => {
        this._onPointerMove(previousPointers, pointerTracker.currentPointers);
      },
      // Unfortunately Safari on iOS has a bug where pointer event capturing
      // doesn't work in some cases, and we hit those cases due to our event
      // retargeting in pinch-zoom.
      // https://bugs.webkit.org/show_bug.cgi?id=220196
      avoidPointerEvents: isSafari,
    });

    this.addEventListener('wheel', (event) => this._onWheel(event));
  }

  connectedCallback() {
    this._stageElChange();
  }

  get x() {
    return this._transform.e;
  }

  get y() {
    return this._transform.f;
  }

  get scale() {
    return this._transform.a;
  }

  /**
   * Change the scale, adjusting x/y by a given transform origin.
   */
  scaleTo(scale: number, opts: ScaleToOpts = {}) {
    let { originX = 0, originY = 0 } = opts;

    const { relativeTo = 'content', allowChangeEvent = false } = opts;

    const relativeToEl = relativeTo === 'content' ? this._positioningEl : this;

    // No content element? Fall back to just setting scale
    if (!relativeToEl || !this._positioningEl) {
      this.setTransform({ scale, allowChangeEvent });
      return;
    }

    const rect = relativeToEl.getBoundingClientRect();
    originX = getAbsoluteValue(originX, rect.width);
    originY = getAbsoluteValue(originY, rect.height);

    if (relativeTo === 'content') {
      originX += this.x;
      originY += this.y;
    } else {
      const currentRect = this._positioningEl.getBoundingClientRect();
      originX -= currentRect.left;
      originY -= currentRect.top;
    }

    this._applyChange({
      allowChangeEvent,
      originX,
      originY,
      scaleDiff: scale / this.scale,
    });
  }

  /**
   * Update the stage with a given scale/x/y.
   */
  setTransform(opts: SetTransformOpts = {}) {
    const { scale = this.scale, allowChangeEvent = false } = opts;

    let { x = this.x, y = this.y } = opts;

    // If we don't have an element to position, just set the value as given.
    // We'll check bounds later.
    if (!this._positioningEl) {
      this._updateTransform(scale, x, y, allowChangeEvent);
      return;
    }

    // Get current layout
    const thisBounds = this.getBoundingClientRect();
    const positioningElBounds = this._positioningEl.getBoundingClientRect();

    // Not displayed. May be disconnected or display:none.
    // Just take the values, and we'll check bounds later.
    if (!thisBounds.width || !thisBounds.height) {
      this._updateTransform(scale, x, y, allowChangeEvent);
      return;
    }

    // Create points for _positioningEl.
    let topLeft = createPoint();
    topLeft.x = positioningElBounds.left - thisBounds.left;
    topLeft.y = positioningElBounds.top - thisBounds.top;
    let bottomRight = createPoint();
    bottomRight.x = positioningElBounds.width + topLeft.x;
    bottomRight.y = positioningElBounds.height + topLeft.y;

    // Calculate the intended position of _positioningEl.
    const matrix = createMatrix()
      .translate(x, y)
      .scale(scale)
      // Undo current transform
      .multiply(this._transform.inverse());

    topLeft = topLeft.matrixTransform(matrix);
    bottomRight = bottomRight.matrixTransform(matrix);

    // Ensure _positioningEl can't move beyond out-of-bounds.
    // Correct for x
    if (topLeft.x > thisBounds.width) {
      x += thisBounds.width - topLeft.x;
    } else if (bottomRight.x < 0) {
      x += -bottomRight.x;
    }

    // Correct for y
    if (topLeft.y > thisBounds.height) {
      y += thisBounds.height - topLeft.y;
    } else if (bottomRight.y < 0) {
      y += -bottomRight.y;
    }

    this._updateTransform(scale, x, y, allowChangeEvent);
  }

  /**
   * Update transform values without checking bounds. This is only called in setTransform.
   */
  private _updateTransform(
    scale: number,
    x: number,
    y: number,
    allowChangeEvent: boolean,
  ) {
    // Avoid scaling to zero
    if (scale < MIN_SCALE) return;

    // Avoid scaling to very large values
    if (scale > MAX_SCALE) return;

    // Return if there's no change
    if (scale === this.scale && x === this.x && y === this.y) return;

    this._transform.e = x;
    this._transform.f = y;
    this._transform.d = this._transform.a = scale;

    this.style.setProperty('--x', this.x + 'px');
    this.style.setProperty('--y', this.y + 'px');
    this.style.setProperty('--scale', this.scale + '');

    if (allowChangeEvent) {
      const event = new Event('change', { bubbles: true });
      this.dispatchEvent(event);
    }
  }

  /**
   * Called when the direct children of this element change.
   * Until we have have shadow dom support across the board, we
   * require a single element to be the child of <pinch-zoom>, and
   * that's the element we pan/scale.
   */
  private _stageElChange() {
    this._positioningEl = undefined;

    if (this.children.length === 0) return;

    this._positioningEl = this.children[0];

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    // Do a bounds check
    this.setTransform({ allowChangeEvent: true });
  }

  private _onWheel(event: WheelEvent) {
    if (!this._positioningEl) return;
    event.preventDefault();

    const currentRect = this._positioningEl.getBoundingClientRect();
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

    this._applyChange({
      scaleDiff,
      originX: event.clientX - currentRect.left,
      originY: event.clientY - currentRect.top,
      allowChangeEvent: true,
    });
  }

  private _onPointerMove(
    previousPointers: Pointer[],
    currentPointers: Pointer[],
  ) {
    if (!this._positioningEl) return;

    // Combine next points with previous points
    const currentRect = this._positioningEl.getBoundingClientRect();

    // For calculating panning movement
    const prevMidpoint = getMidpoint(previousPointers[0], previousPointers[1]);
    const newMidpoint = getMidpoint(currentPointers[0], currentPointers[1]);

    // Midpoint within the element
    const originX = prevMidpoint.clientX - currentRect.left;
    const originY = prevMidpoint.clientY - currentRect.top;

    // Calculate the desired change in scale
    const prevDistance = getDistance(previousPointers[0], previousPointers[1]);
    const newDistance = getDistance(currentPointers[0], currentPointers[1]);
    const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

    this._applyChange({
      originX,
      originY,
      scaleDiff,
      panX: newMidpoint.clientX - prevMidpoint.clientX,
      panY: newMidpoint.clientY - prevMidpoint.clientY,
      allowChangeEvent: true,
    });
  }

  /** Transform the view & fire a change event */
  private _applyChange(opts: ApplyChangeOpts = {}) {
    const {
      panX = 0,
      panY = 0,
      originX = 0,
      originY = 0,
      scaleDiff = 1,
      allowChangeEvent = false,
    } = opts;

    const matrix = createMatrix()
      // Translate according to panning.
      .translate(panX, panY)
      // Scale about the origin.
      .translate(originX, originY)
      // Apply current translate
      .translate(this.x, this.y)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current scale.
      .scale(this.scale);

    // Convert the transform into basic translate & scale.
    this.setTransform({
      allowChangeEvent,
      scale: matrix.a,
      x: matrix.e,
      y: matrix.f,
    });
  }
}

customElements.define('pinch-zoom', PinchZoom);
