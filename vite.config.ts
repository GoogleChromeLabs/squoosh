import { defineConfig, Plugin } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import { readFileSync } from 'fs';
import { lookup as lookupMime } from 'mime-types';

// Plugin для обработки add-css: импортов
function addCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-add-css',
    resolveId(id) {
      if (id.startsWith('add-css:')) {
        return '\0' + id;
      }
    },
    load(id) {
      if (id.startsWith('\0add-css:')) {
        const cssPath = id.slice('\0add-css:'.length);
        return `
          if (typeof document !== 'undefined') {
            import('${cssPath}?inline').then(module => {
              const style = document.createElement('style');
              style.textContent = module.default;
              document.head.appendChild(style);
            });
          }
          export default {};
        `;
      }
    },
  };
}

// Plugin для обработки url: импортов
function urlPlugin(): Plugin {
  return {
    name: 'vite-plugin-url',
    resolveId(id) {
      if (id.startsWith('url:') || id.startsWith('img-url:')) {
        return '\0' + id;
      }
    },
    load(id) {
      if (id.startsWith('\0url:') || id.startsWith('\0img-url:')) {
        const prefix = id.startsWith('\0url:') ? '\0url:' : '\0img-url:';
        const filePath = id.slice(prefix.length);
        return `export default new URL('${filePath}', import.meta.url).href;`;
      }
    },
  };
}

// Plugin для обработки data-url: импортов
function dataUrlPlugin(): Plugin {
  return {
    name: 'vite-plugin-data-url',
    resolveId(id) {
      if (id.startsWith('data-url:') || id.startsWith('data-url-text:')) {
        return '\0' + id;
      }
    },
    load(id) {
      if (id.startsWith('\0data-url:') || id.startsWith('\0data-url-text:')) {
        const isText = id.startsWith('\0data-url-text:');
        const prefix = isText ? '\0data-url-text:' : '\0data-url:';
        const filePath = id.slice(prefix.length);
        
        try {
          const resolvedPath = path.resolve(filePath);
          const source = readFileSync(resolvedPath);
          const mimeType = lookupMime(filePath) || 'text/plain';
          
          if (isText) {
            const encodedBody = encodeURIComponent(source.toString('utf8'));
            return `export default "data:${mimeType};charset=utf-8,${encodedBody}";`;
          }
          
          return `export default "data:${mimeType};base64,${source.toString('base64')}";`;
        } catch (e) {
          this.error(`Failed to load file: ${filePath}`);
        }
      }
    },
  };
}

// Plugin для обработки omt: (Off-Main-Thread) импортов
function omtPlugin(): Plugin {
  return {
    name: 'vite-plugin-omt',
    resolveId(id) {
      if (id.startsWith('omt:')) {
        return '\0' + id;
      }
    },
    load(id) {
      if (id.startsWith('\0omt:')) {
        const workerPath = id.slice('\0omt:'.length);
        return `
          import Worker from '${workerPath}?worker';
          export default Worker;
        `;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    addCssPlugin(),
    urlPlugin(),
    dataUrlPlugin(),
    omtPlugin(),
  ],
  resolve: {
    alias: {
      'static-build': path.resolve(__dirname, './src/static-build'),
      client: path.resolve(__dirname, './src/client'),
      shared: path.resolve(__dirname, './src/shared'),
      features: path.resolve(__dirname, './src/features'),
      'worker-shared': path.resolve(__dirname, './src/worker-shared'),
      wordpress: path.resolve(__dirname, './src/wordpress-integration'),
      // Алиасы для кодеков
      codecs: path.resolve(__dirname, './codecs'),
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
    fs: {
      // Разрешить доступ к codecs директории
      allow: ['..'],
    },
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
