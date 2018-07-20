import * as styles from './styles.css';
import { PointerTracker, Pointer } from '../../../../lib/PointerTracker';

const legacyClipCompatAttr = 'legacy-clip-compat';
const orientationAttr = 'orientation';

type TwoUpOrientation = 'horizontal' | 'vertical';

/**
 * A split view that the user can adjust. The first child becomes
 * the left-hand side, and the second child becomes the right-hand side.
 */
export default class TwoUp extends HTMLElement {
  static get observedAttributes() { return [orientationAttr]; }

  private readonly _handle = document.createElement('div');
  /**
   * The position of the split in pixels.
   */
  private _position = 0;
  /**
   * The value of _position when the pointer went down.
   */
  private _positionOnPointerStart = 0;
  /**
   * Has connectedCallback been called yet?
   */
  private _everConnected = false;

  constructor () {
    super();
    this._handle.className = styles.twoUpHandle;

    // Watch for children changes.
    // Note this won't fire for initial contents,
    // so _childrenChange is also called in connectedCallback.
    new MutationObserver(() => this._childrenChange())
      .observe(this, { childList: true });

    // Watch for pointers on the handle.
    const pointerTracker: PointerTracker = new PointerTracker(this._handle, {
      start: (_, event) => {
        // We only want to track 1 pointer.
        if (pointerTracker.currentPointers.length === 1) return false;
        event.preventDefault();
        this._positionOnPointerStart = this._position;
        return true;
      },
      move: () => {
        this._pointerChange(
          pointerTracker.startPointers[0],
          pointerTracker.currentPointers[0],
        );
      },
    });
  }

  connectedCallback() {
    this._childrenChange();
    if (!this._everConnected) {
      this._resetPosition();
      this._everConnected = true;
    }
  }

  attributeChangedCallback(name: string) {
    if (name === orientationAttr) {
      this._resetPosition();
    }
  }

  private _resetPosition() {
    // Set the initial position of the handle.
    requestAnimationFrame(() => {
      const bounds = this.getBoundingClientRect();
      this._position = (this.orientation === 'vertical' ? bounds.height : bounds.width) / 2;
      this._setPosition();
    });
  }

  /**
   * If true, this element works in browsers that don't support clip-path (Edge).
   * However, this means you'll have to set the height of this element manually.
   */
  get legacyClipCompat() {
    return this.hasAttribute(legacyClipCompatAttr);
  }

  set legacyClipCompat(val: boolean) {
    if (val) {
      this.setAttribute(legacyClipCompatAttr, '');
    } else {
      this.removeAttribute(legacyClipCompatAttr);
    }
  }

  /**
   * Split vertically rather than horizontally.
   */
  get orientation(): TwoUpOrientation {
    const value = this.getAttribute(orientationAttr);

    // This mirrors the behaviour of input.type, where setting just sets the attribute, but getting
    // returns the value only if it's valid.
    if (value && value.toLowerCase() === 'vertical') return 'vertical';
    return 'horizontal';
  }

  set orientation(val: TwoUpOrientation) {
    this.setAttribute(orientationAttr, val);
  }

  /**
   * Called when element's child list changes
   */
  private _childrenChange() {
    // Ensure the handle is the last child.
    // The CSS depends on this.
    if (this.lastElementChild !== this._handle) {
      this.appendChild(this._handle);
    }
  }

  /**
   * Called when a pointer moves.
   */
  private _pointerChange(startPoint: Pointer, currentPoint: Pointer) {
    const pointAxis = this.orientation === 'vertical' ? 'clientY' : 'clientX';
    const dimensionAxis = this.orientation === 'vertical' ? 'height' : 'width';
    const bounds = this.getBoundingClientRect();

    this._position = this._positionOnPointerStart +
      (currentPoint[pointAxis] - startPoint[pointAxis]);

    // Clamp position to element bounds.
    this._position = Math.max(0, Math.min(this._position, bounds[dimensionAxis]));
    this._setPosition();
  }

  private _setPosition() {
    this.style.setProperty('--split-point', `${this._position}px`);
  }
}

customElements.define('two-up', TwoUp);
