import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
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
  build: {
    target: 'es2022',
    outDir: '.tmp/build/vite',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 5000,
    open: true,
  },
  optimizeDeps: {
    include: ['preact', 'preact/hooks'],
  },
});
