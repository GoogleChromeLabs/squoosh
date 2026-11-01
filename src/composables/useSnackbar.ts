import { shallowReactive } from 'vue';

export interface SnackOptions {
  /** Milliseconds until the snack goes away by itself. 0 means never. */
  timeout?: number;
  actions?: string[];
}

export interface Snack {
  id: number;
  message: string;
  timeout: number;
  actions: string[];
  /** Called with the clicked action, or '' on timeout. */
  resolve(action: string): void;
}

/** Snacks waiting to be shown. The first one is on screen. */
export const snackQueue = shallowReactive<Snack[]>([]);

let nextId = 0;

/**
 * Show a snackbar. Snacks are shown one at a time. Returns a promise for the
 * name of the action clicked, or an empty string if it timed out.
 */
export function showSnack(
  message: string,
  { timeout = 0, actions = ['dismiss'] }: SnackOptions = {},
): Promise<string> {
  return new Promise((resolve) => {
    snackQueue.push({ id: nextId++, message, timeout, actions, resolve });
  });
}

export type ShowSnack = typeof showSnack;
