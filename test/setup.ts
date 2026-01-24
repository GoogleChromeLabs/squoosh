/**
 * Vitest test setup file
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Polyfill for PromiseRejectionEvent in test environment
if (typeof PromiseRejectionEvent === 'undefined') {
  (global as any).PromiseRejectionEvent = class PromiseRejectionEvent extends (
    Event
  ) {
    promise: Promise<any>;
    reason: any;

    constructor(type: string, init?: { promise?: Promise<any>; reason?: any }) {
      super(type);
      this.promise = init?.promise || Promise.reject(init?.reason);
      this.reason = init?.reason;
    }
  };
}
