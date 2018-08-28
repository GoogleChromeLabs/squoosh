// TypeScript, you make me sad.
// https://github.com/Microsoft/TypeScript/issues/18756
interface Window {
  PointerEvent: typeof PointerEvent;
  Touch: typeof Touch;
}

interface PointerEvent {
  getCoalescedEvents(): PointerEvent[];
}
