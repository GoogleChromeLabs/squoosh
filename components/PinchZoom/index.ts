import "./styles.css";

interface Point {
  x: number,
  y: number
}

interface PointWithId extends Point {
  // Either the touch/pointer ID, or -1 for mouse event
  id: number
}

type UpToTwoPoints = [PointWithId | undefined, PointWithId | undefined];

function getDistance(a?: Point, b?: Point): number {
  if (!a && !b) throw new Error("Must provide at least one point");

  // If only one of a/b is defined
  if (!(a && b)) {
    return 0;
  }

  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getMidpoint(a?: Point, b?: Point): Point {
  if (!a && !b) throw new Error("Must provide at least one point");

  // If only one of a/b is defined
  if (!(a && b)) {
    // TypeScript isn't smart enough to know that one of these must be a Point
    return (a || b) as Point;
  }

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

let cachedSvg: SVGSVGElement;

// I'd rather use DOMMatrix here, but the browser support isn't good enough.
// Given that, better to use something everything supports.
function createMatrix(): SVGMatrix {
  if (!cachedSvg) {
    cachedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }

  return cachedSvg.createSVGMatrix();
}

export default class PinchZoom extends HTMLElement {
  // The element that we'll transform.
  // Ideally this would be shadow DOM, but we don't have the browser
  // support yet.
  private _positioningEl?: HTMLElement;
  // Current transform.
  private _x = 10;
  private _y = 10;
  private _scale = 10;
  // The pointers (mouse & touch) that we're observing.
  // We only track two points at most.
  private _activePoints: UpToTwoPoints = [undefined, undefined];
  // Next pointer positions.
  private _pointUpdates: UpToTwoPoints = [undefined, undefined];
  private _mouseUpListener = (event: MouseEvent) => this._mouseEnd(event);
  private _mouseMoveListener = (event: MouseEvent) => this._mouseMove(event);

  constructor () {
    super();

    // Watch for children changes
    new MutationObserver(() => this._stageElChange())
      .observe(this, { childList: true });

    // Set up the events
    this.addEventListener('mousedown', event => this._mouseStart(event));
    this.addEventListener('touchstart', event => this._touchStart(event));
    this.addEventListener('touchmove', event => this._touchMove(event));
    this.addEventListener('touchend', event => this._touchEnd(event));
  }

  connectedCallback() {
    this._stageElChange();
  }

  /**
   * Called when the direct children of this element change.
   * Until we have have shadow dom support across the board, we
   * require a single element to be the child of <pinch-zoom>, and
   * that's the element we pan/scale.
   */
  private _stageElChange() {
    this._positioningEl = undefined;

    if (this.children.length == 0) {
      console.warn('There should be at least one child in <pinch-zoom>.');
      return;
    }

    const el = this.children[0];

    if (!(el instanceof HTMLElement)) {
      console.warn('The first child of <pinch-zoom> must be an HTMLElement.');
      return;
    }

    this._positioningEl = el;
    el.style.transformOrigin = '0 0';

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    this._applyTransform();
  }

  private _update() {
    // Combine next points with previous points
    const currentPoints = this._pointUpdates.map((p, i) => p || this._activePoints[i]) as UpToTwoPoints;
    const thisRect = this.getBoundingClientRect();
    const prevDistance = getDistance(...this._activePoints);
    const newDistance = getDistance(...currentPoints);
    const prevMidpoint = getMidpoint(...this._activePoints);
    const newMidpoint = getMidpoint(...currentPoints);
    const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

    const matrix = createMatrix()
      .translate(newMidpoint.x - prevMidpoint.x, newMidpoint.y - prevMidpoint.y)
      .translate((prevMidpoint.x - thisRect.left), (prevMidpoint.y - thisRect.top))
      .scale(scaleDiff)
      .translate(-(prevMidpoint.x - thisRect.left), -(prevMidpoint.y - thisRect.top))
      .translate(this._x, this._y)
      .scale(this._scale)
      ;

    this._x = matrix.e;
    this._y = matrix.f;
    this._scale = matrix.a;

    this._applyTransform();
    /*
    this._x += (newMidpoint.x - prevMidpoint.x);
    this._y += (newMidpoint.y - prevMidpoint.y);
    this._scale *= scaleDiff;
    */


    this._activePoints = currentPoints;
    this._pointUpdates = [undefined, undefined];
  }

  private _applyTransform() {
    if (!this._positioningEl) return;
    this._positioningEl.style.transform = `translate(${this._x}px, ${this._y}px) scale(${this._scale})`;
  }

  private _mouseStart(event: MouseEvent) {
    if (event.which !== 1) return;
    if (!this._pointStart({ x: event.clientX, y: event.clientY, id: -1 })) return;

    event.preventDefault();
    window.addEventListener('mouseup', this._mouseUpListener);
    window.addEventListener('mousemove', this._mouseMoveListener);
  }

  private _touchStart(event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      if (this._pointStart({ x: touch.clientX, y: touch.clientY, id: touch.identifier })) {
        event.preventDefault();
      }
    }
  }

  /**
   * Observe a point. Returns false if we're already listening to two points.
   */
  private _pointStart(point: PointWithId): boolean {
    const emptyPointIndex = this._activePoints.indexOf(undefined);

    // Bail if we're already tracking two points.
    if (emptyPointIndex === -1) return false;
    this._pointUpdates[emptyPointIndex] = this._activePoints[emptyPointIndex] = point;
    return true;
  }

  private _mouseMove(event: MouseEvent) {
    const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === -1));
    if (pointIndex === -1) return;

    this._pointUpdates[pointIndex] = {x: event.clientX, y: event.clientY, id: -1};
    // I wish we were debouncing this to requestAnimationFrame,
    // but we can't since Safari & Edge schedule it incorrectly.
    this._update();
  }

  private _touchMove(event: TouchEvent) {
    let shouldUpdate = false;

    for (const touch of Array.from(event.changedTouches)) {
      const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === touch.identifier));
      if (pointIndex === -1) continue;
      shouldUpdate = true;
      this._pointUpdates[pointIndex] = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
    }

    if (shouldUpdate) this._update();
  }

  private _mouseEnd(event: MouseEvent) {
    const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === -1));
    if (pointIndex === -1) return;

    this._activePoints[pointIndex] = undefined;

    window.removeEventListener('mouseup', this._mouseUpListener);
    window.removeEventListener('mousemove', this._mouseMoveListener);
  }

  private _touchEnd(event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === touch.identifier));
      if (pointIndex === -1) continue;
      this._activePoints[pointIndex] = undefined;
    }
  }
}

customElements.define('pinch-zoom', PinchZoom);

// Initial scale & pos - attributes
// Go to new scale pos, animate to new scale pos
// On change event
// scale & x & y props
// Test multiple instances
// Lock to bounds attr
// Exclude selector
// Anchor point for resize
// Use mouse wheel?
