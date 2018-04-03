import './styles.css';
import { PointerTracker, Pointer } from '../../utils/PointerTracker';

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

interface SetTransformOpts {
  scale?: number;
  x?: number;
  y?: number;
  /**
   * Fire a 'change' event if values are different to current values
   */
  allowChangeEvent?: boolean;
}

function getDistance (a: Point, b?: Point): number {
  if (!b) return 0;
  return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
}

function getMidpoint (a: Point, b?: Point): Point {
  if (!b) return a;

  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
  };
}

// I'd rather use DOMMatrix/DOMPoint here, but the browser support isn't good enough.
// Given that, better to use something everything supports.
let cachedSvg: SVGSVGElement;

function getSVG (): SVGSVGElement {
  return cachedSvg || (cachedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
}

function createMatrix (): SVGMatrix {
  return getSVG().createSVGMatrix();
}

function createPoint (): SVGPoint {
  return getSVG().createSVGPoint();
}

export default class PinchZoom extends HTMLElement {
  // The element that we'll transform.
  // Ideally this would be shadow DOM, but we don't have the browser
  // support yet.
  private _positioningEl?: Element;
  // Current transform.
  private _transform: SVGMatrix = createMatrix();

  constructor () {
    super();

    // Watch for children changes.
    // Note this won't fire for initial contents,
    // so _stageElChange is also called in connectedCallback.
    new MutationObserver(() => this._stageElChange())
      .observe(this, { childList: true });

    // Watch for pointers
    const pointerTracker: PointerTracker = new PointerTracker(this, {
      start: (pointer, event) => {
        // We only want to track 2 pointers at most
        if (pointerTracker.currentPointers.length === 2 || !this._positioningEl) return false;
        event.preventDefault();

        // Record current state
        pointerTracker.resetStartPointers();
        return true;
      },
      move: previousPointers => {
        this._onPointerMove(previousPointers, pointerTracker.currentPointers);
      }
    });

    this.addEventListener('wheel', event => this._onWheel(event));
  }

  connectedCallback () {
    this._stageElChange();
  }

  get x () {
    return this._transform.e;
  }

  get y () {
    return this._transform.f;
  }

  get scale () {
    return this._transform.a;
  }

  /**
   * Update the stage with a given scale/x/y.
   */
  setTransform (opts: SetTransformOpts = {}) {
    const {
      scale = this.scale,
      allowChangeEvent = false
    } = opts;

    let {
      x = this.x,
      y = this.y
    } = opts;

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
    let matrix = createMatrix()
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
  _updateTransform (scale: number, x: number, y: number, allowChangeEvent: boolean) {
    // Return if there's no change
    if (
      scale === this.scale &&
      x === this.x &&
      y === this.y
    ) return;

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
  private _stageElChange () {
    this._positioningEl = undefined;

    if (this.children.length === 0) {
      console.warn('There should be at least one child in <pinch-zoom>.');
      return;
    }

    this._positioningEl = this.children[0];

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    // Do a bounds check
    this.setTransform();
  }

  private _onWheel (event: WheelEvent) {
    event.preventDefault();

    const thisRect = this.getBoundingClientRect();
    let { deltaY } = event;
    const { ctrlKey, deltaMode } = event;

    if (deltaMode === 1) { // 1 is "lines", 0 is "pixels"
      // Firefox uses "lines" for some types of mouse
      deltaY *= 15;
    }

    // ctrlKey is true when pinch-zooming on a trackpad.
    const divisor = ctrlKey ? 100 : 300;
    const scaleDiff = 1 - deltaY / divisor;

    this._applyChange({
      scaleDiff,
      originX: event.clientX - thisRect.left,
      originY: event.clientY - thisRect.top
    });
  }

  private _onPointerMove (previousPointers: Pointer[], currentPointers: Pointer[]) {
    // Combine next points with previous points
    const thisRect = this.getBoundingClientRect();

    // For calculating panning movement
    const prevMidpoint = getMidpoint(previousPointers[0], previousPointers[1]);
    const newMidpoint = getMidpoint(currentPointers[0], currentPointers[1]);

    // Midpoint within the element
    const originX = prevMidpoint.clientX - thisRect.left;
    const originY = prevMidpoint.clientY - thisRect.top;

    // Calculate the desired change in scale
    const prevDistance = getDistance(previousPointers[0], previousPointers[1]);
    const newDistance = getDistance(currentPointers[0], currentPointers[1]);
    const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

    this._applyChange({
      originX, originY, scaleDiff,
      panX: newMidpoint.clientX - prevMidpoint.clientX,
      panY: newMidpoint.clientY - prevMidpoint.clientY
    });
  }

  /** Transform the view & fire a change event */
  private _applyChange (opts: ApplyChangeOpts = {}) {
    const {
      panX = 0, panY = 0,
      originX = 0, originY = 0,
      scaleDiff = 1
    } = opts;

    const matrix = createMatrix()
      // Translate according to panning.
      .translate(panX, panY)
      // Scale about the origin.
      .translate(originX, originY)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current transform.
      .multiply(this._transform);

    // Convert the transform into basic translate & scale.
    this.setTransform({
      scale: matrix.a,
      x: matrix.e,
      y: matrix.f,
      allowChangeEvent: true
    });
  }
}

customElements.define('pinch-zoom', PinchZoom);

// TODO:
// scale by method, which takes a scaleDiff and a center
// Go to new scale pos, animate to new scale pos
// On change event
// scale & x & y props
// Exclude selector
// Anchor point for resize
