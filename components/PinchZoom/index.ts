import './styles.css';
import { PointerTracker, Pointer } from '../../utils/trackDragging';

interface Point {
  clientX: number;
  clientY: number;
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
  private _positioningEl?: HTMLElement;
  // Current transform.
  private _x = 0;
  private _y = 0;
  private _scale = 1;

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
        if (pointerTracker.currentPointers.length === 2) return false;
        event.preventDefault();
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
    return this._x;
  }

  get y () {
    return this._y;
  }

  get scale () {
    return this._scale;
  }

  /**
   * Update the stage with a given scale/x/y.
   */
  setTransform (scale: number = this._scale, x: number = this._x, y: number = this._y, {
    allowChangeEvent = false
  }: {
    /**
     * Fire a 'change' event if values are different to current values
     */
    allowChangeEvent?: boolean
  } = {}) {
    // Bail if there's no change
    if (
      scale === this._scale &&
      x === this._x &&
      y === this._y
    ) return;

    this._x = x;
    this._y = y;
    this._scale = scale;

    this.style.setProperty('--x', this._x + 'px');
    this.style.setProperty('--y', this._y + 'px');
    this.style.setProperty('--scale', this._scale + '');

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

    const el = this.children[0];

    if (!(el instanceof HTMLElement)) {
      console.warn('The first child of <pinch-zoom> must be an HTMLElement.');
      return;
    }

    this._positioningEl = el;

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    this.setTransform();
  }

  private _onWheel (event: WheelEvent) {
    event.preventDefault();

    const thisRect = this.getBoundingClientRect();
    const { deltaY, ctrlKey } = event;

    // ctrlKey is true when pinch-zooming on a trackpad.
    const divisor = ctrlKey ? 100 : 300;
    const scaleDiff = -deltaY / divisor + 1;

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
  private _applyChange ({
    panX = 0,
    panY = 0,
    scaleDiff = 1,
    originX = 0,
    originY = 0
  }: {
    panX?: number,
    panY?: number,
    scaleDiff?: number,
    originX?: number,
    originY?: number
  } = {}) {
    const { width, height } = this.getBoundingClientRect();
    let topLeft = createPoint();
    let bottomRight = createPoint();
    bottomRight.x = width;
    bottomRight.y = height;

    let matrix = createMatrix()
      // Translate according to panning
      .translate(panX, panY)
      // Scale about the origin
      .translate(originX, originY)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current transform
      .translate(this._x, this._y)
      .scale(this._scale);

    // Clamp to bounds…
    topLeft = topLeft.matrixTransform(matrix);
    bottomRight = bottomRight.matrixTransform(matrix);
    let xCorrection = 0;
    let yCorrection = 0;

    // If x bounds are neither covering nor containing.
    if (
      (topLeft.x > 0 && bottomRight.x > width) ||
      (topLeft.x < 0 && bottomRight.x < width)
    ) {
      // If x bounds are larger than container.
      if (bottomRight.x - topLeft.x > width) {
        if (bottomRight.x > width) {
          xCorrection = -topLeft.x;
        } else {
          xCorrection = width - bottomRight.x;
        }
      // Else x bounds are smaller than container.
      } else {
        if (bottomRight.x > width) {
          xCorrection = width - bottomRight.x;
        } else {
          xCorrection = -topLeft.x;
        }
      }
    }

    // If y bounds are neither covering nor containing.
    if (
      (topLeft.y > 0 && bottomRight.y > height) ||
      (topLeft.y < 0 && bottomRight.y < height)
    ) {
      // If y bounds are larger than container.
      if (bottomRight.y - topLeft.y > height) {
        if (bottomRight.y > height) {
          yCorrection = -topLeft.y;
        } else {
          yCorrection = height - bottomRight.y;
        }
        // Else y bounds are smaller than container.
      } else {
        if (bottomRight.y > height) {
          yCorrection = height - bottomRight.y;
        } else {
          yCorrection = -topLeft.y;
        }
      }
    }

    // If the stage is out-of-bounds, apply a correction.
    if (xCorrection || yCorrection) {
      matrix = createMatrix()
        .translate(xCorrection, yCorrection)
        .multiply(matrix);
    }

    // Convert the transform into basic translate & scale.
    this.setTransform(matrix.a, matrix.e, matrix.f, { allowChangeEvent: true });
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
