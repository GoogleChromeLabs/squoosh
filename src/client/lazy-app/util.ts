interface TransitionOptions {
  from?: number;
  to?: number;
  duration?: number;
  easing?: string;
}

export async function transitionHeight(
  el: HTMLElement,
  opts: TransitionOptions,
): Promise<void> {
  const {
    from = el.getBoundingClientRect().height,
    to = el.getBoundingClientRect().height,
    duration = 1000,
    easing = 'ease-in-out',
  } = opts;

  if (from === to || duration === 0) {
    el.style.height = to + 'px';
    return;
  }

  el.style.height = from + 'px';
  // Force a style calc so the browser picks up the start value.
  getComputedStyle(el).transform;
  el.style.transition = `height ${duration}ms ${easing}`;
  el.style.height = to + 'px';

  return new Promise<void>((resolve) => {
    const listener = (event: Event) => {
      if (event.target !== el) return;
      el.style.transition = '';
      el.removeEventListener('transitionend', listener);
      el.removeEventListener('transitioncancel', listener);
      resolve();
    };

    el.addEventListener('transitionend', listener);
    el.addEventListener('transitioncancel', listener);
  });
}

/**
 * Take a signal and promise, and returns a promise that rejects with an AbortError if the abort is
 * signalled, otherwise resolves with the promise.
 */
export async function abortable<T>(
  signal: AbortSignal,
  promise: Promise<T>,
): Promise<T> {
  if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      signal.addEventListener('abort', () =>
        reject(new DOMException('AbortError', 'AbortError')),
      );
    }),
  ]);
}

/**
 * Compare two objects, returning a boolean indicating if they have the same properties and strictly
 * equal values.
 */
export function shallowEqual(one: any, two: any) {
  for (const i in one) if (one[i] !== two[i]) return false;
  for (const i in two) if (!(i in one)) return false;
  return true;
}
