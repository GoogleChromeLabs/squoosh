import initOxiPNG, { start_worker_thread } from './pkg/squoosh_oxipng.js';

addEventListener('message', async ({ data: [module, memory, threadPtr] }) => {
  // console.log([module, memory, threadPtr]);
  await initOxiPNG(module, memory);
  // console.log('Starting', threadPtr);
  start_worker_thread(threadPtr);
}, { once: true });
