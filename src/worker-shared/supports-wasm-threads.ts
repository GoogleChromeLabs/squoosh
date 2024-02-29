import { threads } from 'wasm-feature-detect';

export default async function checkThreadsSupport() {
  const supportsWasmThreads = await threads();
  if (!supportsWasmThreads) return false;

  // Safari 16 shipped with WASM threads support, but it didn't ship with nested workers support.
  // This meant Squoosh failed in Safari 16, since we call our wasm from inside a worker to begin with.

  // Right now, this check is only run from a worker.
  // More implementation is needed to run it from a page.
  if (!('importScripts' in self)) {
    throw Error('Not implemented');
  }

  return 'Worker' in self;
}
