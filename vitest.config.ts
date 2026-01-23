import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '.tmp/',
      ],
    },
  },
  resolve: {
    alias: {
      'static-build': path.resolve(__dirname, './src/static-build'),
      'client': path.resolve(__dirname, './src/client'),
      'shared': path.resolve(__dirname, './src/shared'),
      'features': path.resolve(__dirname, './src/features'),
      'worker-shared': path.resolve(__dirname, './src/worker-shared'),
      'wordpress': path.resolve(__dirname, './src/wordpress-integration'),
    },
  },
});
