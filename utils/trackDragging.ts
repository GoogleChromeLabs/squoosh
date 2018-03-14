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

  constructor(nativePointer: Touch | PointerEvent | MouseEvent) {
    this.pageX = nativePointer.pageX;
    this.pageY = nativePointer.pageY;
    this.clientX = nativePointer.clientX;
    this.clientY = nativePointer.clientY;

    if (self.Touch && nativePointer instanceof Touch) {
      this.id = nativePointer.identifier;
    }
    else if (isPointerEvent(nativePointer)) { // is PointerEvent
      this.id = nativePointer.pointerId;
    }
  }
}

export class TrackDragEvent extends Event {
  constructor(
    type: string,
    readonly relatedEvent: TouchEvent | PointerEvent | MouseEvent,
    readonly startPointers: Pointer[],
    readonly currentPointers: Pointer[]
  ) {
    super(type);
  }

  preventDefault() {
    super.preventDefault();
    this.relatedEvent.preventDefault();
  }

  stopPropagation() {
    super.stopPropagation();
    this.relatedEvent.stopPropagation();
  }

  stopImmediatePropagation() {
    super.stopImmediatePropagation();
    this.relatedEvent.stopImmediatePropagation();
  }
}

export class TrackDragStartEvent extends TrackDragEvent {
  private _willTrackPointer = false;

  constructor(
    relatedEvent: TouchEvent | PointerEvent | MouseEvent,
    startPointers: Pointer[],
    currentPointers: Pointer[],
    readonly pointer: Pointer
  ) {
    super('track-drag-start', relatedEvent, startPointers, currentPointers);
  }

  trackPointer() {
    this._willTrackPointer = true;
  }

  get willTrackPointer() {
    return this._willTrackPointer;
  }
}

export class TrackDragMoveEvent extends TrackDragEvent {
  constructor(
    relatedEvent: TouchEvent | PointerEvent | MouseEvent,
    startPointers: Pointer[],
    currentPointers: Pointer[],
    readonly previousPointers: Pointer[]
  ) {
    super('track-drag-move', relatedEvent, startPointers, currentPointers);
  }
}

export class TrackDragEndEvent extends TrackDragEvent {
  constructor(
    relatedEvent: TouchEvent | PointerEvent | MouseEvent,
    startPointers: Pointer[],
    currentPointers: Pointer[],
    readonly pointer: Pointer
  ) {
    super('track-drag-end', relatedEvent, startPointers, currentPointers);
  }
}

const isPointerEvent = (event: any): event is PointerEvent =>
  self.PointerEvent && event instanceof PointerEvent;

export function trackDragging(element: HTMLElement) {
  const currentPointers: Pointer[] = [];
  const startPointers: Pointer[] = [];

  const triggerPointerStart = (event: PointerEvent | MouseEvent | TouchEvent, pointer: Pointer): boolean => {
    const startEvent = new TrackDragStartEvent(
      event,
      currentPointers.slice(),
      startPointers.slice(),
      pointer
    );
    element.dispatchEvent(startEvent);

    if (!startEvent.willTrackPointer) return false;

    currentPointers.push(pointer);
    startPointers.push(pointer);

    return true;
  }

  const pointerStart = (event: PointerEvent | MouseEvent) => {
    // Only interested in left-button presses.
    if (event.button !== 0) return;
    if (!triggerPointerStart(event, new Pointer(event))) return;

    // Add listeners for additional events.
    // The listeners may already exist, but no harm in adding them again.
    if (isPointerEvent(event)) { // PointerEvent
      element.setPointerCapture(event.pointerId);
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerup', pointerEnd);
    }
    else { // MouseEvent
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', pointerEnd);
    }
  };

  const touchStart = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      triggerPointerStart(event, new Pointer(touch));
    }
  };

  const move = (event: PointerEvent | MouseEvent | TouchEvent) => {
    const previousPointers = currentPointers.slice();
    const changedPointers = ('changedTouches' in event) ?
      Array.from(event.changedTouches).map(t => new Pointer(t)) :
      [new Pointer(event)];

    let shouldFireEvent = false;

    for (const pointer of changedPointers) {
      const index = currentPointers.findIndex(p => p.id === pointer.id);
      if (index === -1) continue;
      shouldFireEvent = true;
      currentPointers[index] = pointer;
    }

    if (!shouldFireEvent) return;

    const moveEvent = new TrackDragMoveEvent(
      event,
      startPointers.slice(),
      currentPointers.slice(),
      previousPointers
    );

    element.dispatchEvent(moveEvent);
  }

  const triggerPointerEnd = (event: PointerEvent | MouseEvent | TouchEvent, pointer: Pointer): boolean => {
    const index = currentPointers.findIndex(p => p.id === pointer.id);
    // Not a pointer we're interested in?
    if (index === -1) return false;

    currentPointers.splice(index, 1);
    startPointers.splice(index, 1);

    const endEvent = new TrackDragEndEvent(
      event,
      startPointers.slice(),
      currentPointers.slice(),
      pointer
    );
    element.dispatchEvent(endEvent);

    return true;
  };

  const pointerEnd = (event: PointerEvent | MouseEvent) => {
    if (!triggerPointerEnd(event, new Pointer(event))) return;

    if (isPointerEvent(event)) {
      if (currentPointers.length) return;
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', pointerEnd);
    }
    else { // MouseEvent
      element.removeEventListener('mousemove', move);
      element.removeEventListener('mouseup', pointerEnd);
    }
  };

  const touchEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      triggerPointerEnd(event, new Pointer(touch));
    }
  };

  if (self.PointerEvent && false) {
    element.addEventListener('pointerdown', pointerStart);
  }
  else {
    element.addEventListener('mousedown', pointerStart);
    element.addEventListener('touchstart', touchStart);
    element.addEventListener('touchmove', move);
    element.addEventListener('touchend', touchEnd);
  }
}

// TODO:
// Document all the methods

interface HTMLElementEventMap {
  'track-drag-start': TrackDragStartEvent,
  'track-drag-move': TrackDragMoveEvent,
  'track-drag-end': TrackDragEndEvent
}
