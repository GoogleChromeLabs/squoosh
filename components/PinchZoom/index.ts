import "./styles.css";
import { trackDragging, TrackDragStartEvent, TrackDragMoveEvent, Pointer } from "../../utils/trackDragging";

interface Point {
  clientX: number;
  clientY: number;
}

function getDistance(a: Point, b?: Point): number {
  if (!b) return 0;
  return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
}

function getMidpoint(a: Point, b?: Point): Point {
  if (!b) return a;

  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
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

    trackDragging(this);

    this.addEventListener('track-drag-start', event => this._trackDragStart(event as TrackDragStartEvent));
    this.addEventListener('track-drag-move', event => this._trackDragMove(event as TrackDragMoveEvent));
  }

  connectedCallback() {
    this._stageElChange();
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get scale() {
    return this._scale;
  }

  /**
   * Update the stage with a given scale/x/y.
   */
  setTransform(scale: number, x: number, y: number) {
    this._x = x;
    this._y = y;
    this._scale = scale;
    this._applyTransform();
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
    el.style.willChange = 'transform';

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    this._applyTransform();
  }

  private _update(previousPointers: Pointer[], currentPointers: Pointer[]) {
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

    const matrix = createMatrix()
      // Translate according to panning
      .translate(newMidpoint.clientX - prevMidpoint.clientX, newMidpoint.clientY - prevMidpoint.clientY)
      // Scale about the origin (between the user's fingers)
      .translate(originX, originY)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current transform
      .translate(this._x, this._y)
      .scale(this._scale);

    // Convert the transform into basic translate & scale.
    if (this._x !== matrix.e || this._y !== matrix.f || this._scale !== matrix.a) {
      this._x = matrix.e;
      this._y = matrix.f;
      this._scale = matrix.a;

      this._applyTransform();

      const event = new Event('change', { bubbles: true });
      this.dispatchEvent(event);
    }
  }

  private _applyTransform() {
    if (!this._positioningEl) return;
    this._positioningEl.style.transform = `translate(${this._x}px, ${this._y}px) scale(${this._scale})`;
  }

  private _trackDragStart(event: TrackDragStartEvent) {
    if (event.currentPointers.length === 2) return;
    event.trackPointer();
    event.preventDefault();
  }

  private _trackDragMove(event: TrackDragMoveEvent) {
    this._update(event.previousPointers, event.currentPointers);
  }
}

customElements.define('pinch-zoom', PinchZoom);

// TODO:
// Zoom on mouse wheel
// scale by method, which takes a scaleDiff and a center
// Initial scale & pos - attributes
// Go to new scale pos, animate to new scale pos
// On change event
// scale & x & y props
// Test multiple instances
// Lock to bounds attr
// Exclude selector
// Anchor point for resize
