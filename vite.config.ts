import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Multithreaded codecs need SharedArrayBuffer, which needs cross-origin isolation.
// Production hosting sends the same headers via public/_headers.
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

const screenshot = (src: string, sizes: string) => ({
  src: `/screenshots/${src}`,
  sizes,
  type: src.endsWith('.png') ? 'image/png' : 'image/jpeg',
  form_factor: sizes.startsWith('540')
    ? ('narrow' as const)
    : ('wide' as const),
});

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,wasm,svg,png,jpg,ico}'],
        // Demo images are cached when used rather than up front.
        globIgnores: ['**/demo-*', 'screenshots/**'],
        // The largest codec is about 3MB.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      manifest: {
        name: 'Squoosh',
        short_name: 'Squoosh',
        description:
          'Compress and compare images with different codecs, right in your browser.',
        start_url: '/?utm_medium=PWA&utm_source=launcher',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fff',
        theme_color: '#ff3385',
        lang: 'en',
        categories: ['photo', 'productivity', 'utilities'],
        icons: [
          { src: '/icon-small.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-large.png', sizes: '1024x1024', type: 'image/png' },
          {
            src: '/icon-large-maskable.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          screenshot('screenshot1.png', '540x720'),
          screenshot('screenshot2.jpg', '540x720'),
          screenshot('screenshot3.jpg', '540x720'),
          screenshot('screenshot4.png', '1024x593'),
          screenshot('screenshot5.jpg', '1024x593'),
          screenshot('screenshot6.jpg', '1024x593'),
        ],
        share_target: {
          action: '/?utm_medium=PWA&utm_source=share-target&share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: { files: [{ name: 'file', accept: ['image/*'] }] },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      codecs: fileURLToPath(new URL('./codecs', import.meta.url)),
    },
  },
  server: { port: 5000, headers: crossOriginIsolation },
  preview: { port: 5000, headers: crossOriginIsolation },
  worker: { format: 'es' },
  build: { target: 'es2022' },
});
