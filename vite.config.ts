import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      'static-build': path.resolve(__dirname, './src/static-build'),
      client: path.resolve(__dirname, './src/client'),
      shared: path.resolve(__dirname, './src/shared'),
      features: path.resolve(__dirname, './src/features'),
      'worker-shared': path.resolve(__dirname, './src/worker-shared'),
      wordpress: path.resolve(__dirname, './src/wordpress-integration'),
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
    sourcemap: true,
    minify: 'terser',
  },
  server: {
    port: 5000,
    open: true,
    strictPort: true,
    host: 'localhost',
  },
  optimizeDeps: {
    include: ['preact', 'preact/hooks'],
    // Exclude service worker module pattern to prevent Vite from trying to optimize it
    exclude: ['service-worker:sw'],
  },
  define: {
    __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __PRERENDER__: JSON.stringify(false),
  },
});
