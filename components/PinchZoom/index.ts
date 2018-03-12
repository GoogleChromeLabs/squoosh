import "./styles.css";

interface Point {
  x: number,
  y: number
}

interface Pointer extends Point {
  // Either the touch/pointer ID, or -1 for mouse event
  id: number,
  fromPointerEvent: boolean
}

type UpToTwoPoints = [Pointer | undefined, Pointer | undefined];

function getDistance(a?: Point, b?: Point): number {
  if (!a && !b) throw new Error("Must provide at least one point");

  // If only one of a/b is defined
  if (!(a && b)) {
    return 0;
  }

  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getMidpoint(a?: Point, b?: Point): Point {
  const eitherPoint = a || b;
  if (!eitherPoint) throw new Error("Must provide at least one point");

  // If only one of a/b is defined
  if (!(a && b)) return eitherPoint;

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function createPointer(point: Touch | MouseEvent): Pointer {
  const pointer: Pointer = {
    x: point.clientX,
    y: point.clientY,
    id: -1,
    fromPointerEvent: false
  };

  if (self.Touch && point instanceof Touch) {
    pointer.id = point.identifier;
  }
  else if (self.PointerEvent && point instanceof PointerEvent) {
    pointer.id = point.pointerId;
    pointer.fromPointerEvent = true;
  }
  return pointer;
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
  private _x = 0;
  private _y = 0;
  private _scale = 1;
  // The pointers (mouse & touch) that we're observing.
  // We only track two points at most.
  private _activePoints: UpToTwoPoints = [undefined, undefined];
  // Next pointer positions.
  private _pointUpdates: UpToTwoPoints = [undefined, undefined];
  private _pointerUpListener = (event: MouseEvent) => this._pointerEnd(event);
  private _pointerMoveListener = (event: MouseEvent) => this._pointerMove(event);

  constructor () {
    super();

    // Watch for children changes.
    // Note this won't fire for initial contents,
    // so _stageElChange is also called in connectedCallback.
    new MutationObserver(() => this._stageElChange())
      .observe(this, { childList: true });

    // Set up the events, favouring pointer events.
    // Some move/up listeners are added later.
    if (self.PointerEvent) {
      this.addEventListener('pointerdown', event => this._pointerStart(event));
    }
    else {
      this.addEventListener('mousedown', event => this._pointerStart(event));
      this.addEventListener('touchstart', event => this._touchStart(event));
      this.addEventListener('touchmove', event => this._touchMove(event));
      this.addEventListener('touchend', event => this._touchEnd(event));
    }
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

    // For calculating panning movement
    const prevMidpoint = getMidpoint(...this._activePoints);
    const newMidpoint = getMidpoint(...currentPoints);

    // Midpoint within the element
    const originX = prevMidpoint.x - thisRect.left;
    const originY = prevMidpoint.y - thisRect.top;

    // Calculate the desired change in scale
    const prevDistance = getDistance(...this._activePoints);
    const newDistance = getDistance(...currentPoints);
    const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

    const matrix = createMatrix()
      // Translate according to panning
      .translate(newMidpoint.x - prevMidpoint.x, newMidpoint.y - prevMidpoint.y)
      // Scale about the origin (between the user's fingers)
      .translate(originX, originY)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current transform
      .translate(this._x, this._y)
      .scale(this._scale);

    // Convert the transform into basic translate & scale.
    this._x = matrix.e;
    this._y = matrix.f;
    this._scale = matrix.a;

    this._applyTransform();

    this._activePoints = currentPoints;
    this._pointUpdates = [undefined, undefined];
  }

  private _applyTransform() {
    if (!this._positioningEl) return;
    this._positioningEl.style.transform = `translate(${this._x}px, ${this._y}px) scale(${this._scale})`;
  }

  /**
   * Observe a point. Returns false if we're already listening to two points.
   */
  private _addPointer(point: Touch | MouseEvent): boolean {
    const emptyPointIndex = this._activePoints.indexOf(undefined);

    // Bail if we're already tracking two points.
    if (emptyPointIndex === -1) return false;

    this._activePoints[emptyPointIndex] = createPointer(point);

    return true;
  }

  /**
   * Update a point. Returns false if we're not observing this point.
   */
  private _updatePointer(point: Touch | MouseEvent): boolean {
    const pointer = createPointer(point);
    const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === pointer.id));
    if (pointIndex === -1) return false;
    this._pointUpdates[pointIndex] = pointer;
    return true;
  }

  /**
   * Stop observing a point. Returns false if we're not already observing this point.
   */
  private _removePointer(point: Touch | MouseEvent): boolean {
    const { id } = createPointer(point);
    const pointIndex = this._activePoints.findIndex(p => !!(p && p.id === id));
    if (pointIndex === -1) return false;
    this._activePoints[pointIndex] = undefined;
    return true;
  }

  private _pointerStart(event: MouseEvent) {
    if (event.button !== 0) return;
    if (!this._addPointer(event)) return;

    event.preventDefault();

    if (self.PointerEvent && event instanceof PointerEvent) {
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointerup', this._pointerUpListener);
      this.addEventListener('pointermove', this._pointerMoveListener);
    }
    else {
      window.addEventListener('mouseup', this._pointerUpListener);
      window.addEventListener('mousemove', this._pointerMoveListener);
    }
  }

  private _touchStart(event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      if (this._addPointer(touch)) event.preventDefault();
    }
  }

  private _pointerMove(event: MouseEvent) {
    // I wish we were debouncing this to requestAnimationFrame,
    // but we can't since Safari & Edge schedule it incorrectly.
    if (this._updatePointer(event)) this._update();
  }

  private _touchMove(event: TouchEvent) {
    let shouldUpdate = false;

    for (const touch of Array.from(event.changedTouches)) {
      if (this._updatePointer(touch)) shouldUpdate = true;
    }

    if (shouldUpdate) this._update();
  }

  private _pointerEnd(event: MouseEvent) {
    this._removePointer(event);

    if (self.PointerEvent && event instanceof PointerEvent) {
      // Only remove the listeners if all active pointer events are gone.
      const hasActivePointerEvents = this._activePoints.some(p => !!(p && p.fromPointerEvent));
      if (!hasActivePointerEvents) {
        this.removeEventListener('pointerup', this._pointerUpListener);
        this.removeEventListener('pointermove', this._pointerMoveListener);
      }
    }
    else {
      window.removeEventListener('mouseup', this._pointerUpListener);
      window.removeEventListener('mousemove', this._pointerMoveListener);
    }
  }

  private _touchEnd(event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      this._removePointer(touch);
    }
  }
}

customElements.define('pinch-zoom', PinchZoom);

// TODO:
// MVP
//   Prototype two side by side, where one updates the other
//   Event on change
//   Make it work on touch
// Others…
// Zoom on mouse wheel
// Initial scale & pos - attributes
// Go to new scale pos, animate to new scale pos
// On change event
// scale & x & y props
// Test multiple instances
// Lock to bounds attr
// Exclude selector
// Anchor point for resize
// Use mouse wheel?
