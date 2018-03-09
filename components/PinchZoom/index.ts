import "./styles.css";

interface Point {
  x: number,
  y: number
}

export default class PinchZoom extends HTMLElement {
  private _positioningEl?: HTMLElement;
  private _x = 0;
  private _y = 0;
  private _scale = 1;
  private _lastPoint?: Point;
  private _stopListener = (event: MouseEvent) => this._stopMove(event);
  private _moveListener = (event: MouseEvent) => this._move(event);
  private _animId = 0;

  constructor () {
    super();

    // Watch for children changes
    new MutationObserver(() => this._stageElChange())
      .observe(this, { childList: true });

    // Set up the events
    this.addEventListener('mousedown', event => this._startMove(event));
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

    if (this.children.length > 1) {
      console.warn('<pinch-zoom> must not have more than one child.');
    }

    this._applyTransform();
  }

  private _scheduleApplyTransform() {
    cancelAnimationFrame(this._animId);
    this._animId = requestAnimationFrame(() => this._applyTransform());
  }

  private _applyTransform() {
    if (!this._positioningEl) return;
    this._positioningEl.style.transform = `scale(${this._scale}) translate(${this._x}px, ${this._y}px)`;
  }

  private _startMove(event: MouseEvent) {
    event.preventDefault();
    window.addEventListener('mouseup', this._stopListener);
    window.addEventListener('mousemove', this._moveListener);
    this._lastPoint = { x: event.pageX, y: event.pageY };
  }

  private _move(event: MouseEvent) {
    const thisPoint = { x: event.pageX, y: event.pageY };
    if (this._lastPoint) {
      this._x += thisPoint.x - this._lastPoint.x;
      this._y += thisPoint.y - this._lastPoint.y;
    }
    this._lastPoint = thisPoint;
    this._scheduleApplyTransform();
  }

  private _stopMove(event: MouseEvent) {
    this._lastPoint = undefined;
    window.removeEventListener('mouseup', this._stopListener);
    window.removeEventListener('mousemove', this._moveListener);
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
