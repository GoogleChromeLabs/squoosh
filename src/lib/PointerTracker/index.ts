import { bind } from '../util';
const enum Button { Left }

export class Pointer {
  /** x offset from the top of the document */
  pageX: number;
  /** y offset from the top of the document */
  pageY: number;
  /** x offset from the top of the viewport */
  clientX: number;
  /** y offset from the top of the viewport */
  clientY: number;
  /** ID for this pointer */
  id: number = -1;
  /** The platform object used to create this Pointer */
  nativePointer: Touch | PointerEvent | MouseEvent;

  constructor (nativePointer: Touch | PointerEvent | MouseEvent) {
    this.nativePointer = nativePointer;
    this.pageX = nativePointer.pageX;
    this.pageY = nativePointer.pageY;
    this.clientX = nativePointer.clientX;
    this.clientY = nativePointer.clientY;

    if (self.Touch && nativePointer instanceof Touch) {
      this.id = nativePointer.identifier;
    } else if (isPointerEvent(nativePointer)) { // is PointerEvent
      this.id = nativePointer.pointerId;
    }
  }

  /**
   * Returns an expanded set of Pointers for high-resolution inputs.
   */
  getCoalesced(): Pointer[] {
    if ('getCoalescedEvents' in this.nativePointer) {
      return this.nativePointer.getCoalescedEvents().map(p => new Pointer(p));
    }
    return [this];
  }
}

const isPointerEvent = (event: any): event is PointerEvent =>
  self.PointerEvent && event instanceof PointerEvent;

const noop = () => {};

export type InputEvent = TouchEvent | PointerEvent | MouseEvent;
type StartCallback = (pointer: Pointer, event: InputEvent) => boolean;
type MoveCallback = (
  previousPointers: Pointer[],
  changedPointers: Pointer[],
  event: InputEvent,
) => void;
type EndCallback = (pointer: Pointer, event: InputEvent) => void;

interface PointerTrackerCallbacks {
  /**
   * Called when a pointer is pressed/touched within the element.
   *
   * @param pointer The new pointer.
   * This pointer isn't included in this.currentPointers or this.startPointers yet.
   * @param event The event related to this pointer.
   *
   * @returns Whether you want to track this pointer as it moves.
   */
  start?: StartCallback;
  /**
   * Called when pointers have moved.
   *
   * @param previousPointers The state of the pointers before this event.
   * This contains the same number of pointers, in the same order, as
   * this.currentPointers and this.startPointers.
   * @param changedPointers The pointers that have changed since the last move callback.
   * @param event The event related to the pointer changes.
   */
  move?: MoveCallback;
  /**
   * Called when a pointer is released.
   *
   * @param pointer The final state of the pointer that ended. This
   * pointer is now absent from this.currentPointers and
   * this.startPointers.
   * @param event The event related to this pointer.
   */
  end?: EndCallback;
}

/**
 * Track pointers across a particular element
 */
export class PointerTracker {
  /**
   * State of the tracked pointers when they were pressed/touched.
   */
  readonly startPointers: Pointer[] = [];
  /**
   * Latest state of the tracked pointers. Contains the same number
   * of pointers, and in the same order as this.startPointers.
   */
  readonly currentPointers: Pointer[] = [];

  private _startCallback: StartCallback;
  private _moveCallback: MoveCallback;
  private _endCallback: EndCallback;

  /**
   * Track pointers across a particular element
   *
   * @param element Element to monitor.
   * @param callbacks
   */
  constructor (private _element: HTMLElement, callbacks: PointerTrackerCallbacks) {
    const {
      start = () => true,
      move = noop,
      end = noop,
    } = callbacks;

    this._startCallback = start;
    this._moveCallback = move;
    this._endCallback = end;

    // Add listeners
    if (self.PointerEvent) {
      this._element.addEventListener('pointerdown', this._pointerStart);
    } else {
      this._element.addEventListener('mousedown', this._pointerStart);
      this._element.addEventListener('touchstart', this._touchStart);
      this._element.addEventListener('touchmove', this._move);
      this._element.addEventListener('touchend', this._touchEnd);
    }
  }

  /**
   * Call the start callback for this pointer, and track it if the user wants.
   *
   * @param pointer Pointer
   * @param event Related event
   * @returns Whether the pointer is being tracked.
   */
  private _triggerPointerStart (pointer: Pointer, event: InputEvent): boolean {
    if (!this._startCallback(pointer, event)) return false;
    this.currentPointers.push(pointer);
    this.startPointers.push(pointer);
    return true;
  }

  /**
   * Listener for mouse/pointer starts. Bound to the class in the constructor.
   *
   * @param event This will only be a MouseEvent if the browser doesn't support
   * pointer events.
   */
  @bind
  private _pointerStart (event: PointerEvent | MouseEvent) {
    if (event.button !== Button.Left) return;
    if (!this._triggerPointerStart(new Pointer(event), event)) return;

    // Add listeners for additional events.
    // The listeners may already exist, but no harm in adding them again.
    if (isPointerEvent(event)) {
      this._element.setPointerCapture(event.pointerId);
      this._element.addEventListener('pointermove', this._move);
      this._element.addEventListener('pointerup', this._pointerEnd);
    } else { // MouseEvent
      window.addEventListener('mousemove', this._move);
      window.addEventListener('mouseup', this._pointerEnd);
    }
  }

  /**
   * Listener for touchstart. Bound to the class in the constructor.
   * Only used if the browser doesn't support pointer events.
   */
  @bind
  private _touchStart (event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      this._triggerPointerStart(new Pointer(touch), event);
    }
  }

  /**
   * Listener for pointer/mouse/touch move events.
   * Bound to the class in the constructor.
   */
  @bind
  private _move (event: PointerEvent | MouseEvent | TouchEvent) {
    const previousPointers = this.currentPointers.slice();
    const changedPointers = ('changedTouches' in event) ? // Shortcut for 'is touch event'.
      Array.from(event.changedTouches).map(t => new Pointer(t)) :
      [new Pointer(event)];
    const trackedChangedPointers = [];

    for (const pointer of changedPointers) {
      const index = this.currentPointers.findIndex(p => p.id === pointer.id);
      if (index === -1) continue; // Not a pointer we're tracking
      trackedChangedPointers.push(pointer);
      this.currentPointers[index] = pointer;
    }

    if (trackedChangedPointers.length === 0) return;

    this._moveCallback(previousPointers, trackedChangedPointers, event);
  }

  /**
   * Call the end callback for this pointer.
   *
   * @param pointer Pointer
   * @param event Related event
   */
  @bind
  private _triggerPointerEnd (pointer: Pointer, event: InputEvent): boolean {
    const index = this.currentPointers.findIndex(p => p.id === pointer.id);
    // Not a pointer we're interested in?
    if (index === -1) return false;

    this.currentPointers.splice(index, 1);
    this.startPointers.splice(index, 1);

    this._endCallback(pointer, event);
    return true;
  }

  /**
   * Listener for mouse/pointer ends. Bound to the class in the constructor.
   * @param event This will only be a MouseEvent if the browser doesn't support
   * pointer events.
   */
  @bind
  private _pointerEnd (event: PointerEvent | MouseEvent) {
    if (!this._triggerPointerEnd(new Pointer(event), event)) return;

    if (isPointerEvent(event)) {
      if (this.currentPointers.length) return;
      this._element.removeEventListener('pointermove', this._move);
      this._element.removeEventListener('pointerup', this._pointerEnd);
    } else { // MouseEvent
      window.removeEventListener('mousemove', this._move);
      window.removeEventListener('mouseup', this._pointerEnd);
    }
  }

  /**
   * Listener for touchend. Bound to the class in the constructor.
   * Only used if the browser doesn't support pointer events.
   */
  @bind
  private _touchEnd (event: TouchEvent) {
    for (const touch of Array.from(event.changedTouches)) {
      this._triggerPointerEnd(new Pointer(touch), event);
    }
  }
}
