import { threads } from 'wasm-feature-detect';

async function init() {
  if (await threads()) {
    return (await import('./spawn')).default;
  }
  return import('./pkg');
}

export default init();
