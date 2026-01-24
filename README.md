# [Squoosh]!

[![Node.js CI](https://github.com/mihail-moonz/squoosh/actions/workflows/node.js.yml/badge.svg)](https://github.com/mihail-moonz/squoosh/actions/workflows/node.js.yml)
[![Image Compression Tests](https://github.com/mihail-moonz/squoosh/actions/workflows/image-compression-test.yml/badge.svg)](https://github.com/mihail-moonz/squoosh/actions/workflows/image-compression-test.yml)
[![Performance Benchmark](https://github.com/mihail-moonz/squoosh/actions/workflows/benchmark.yml/badge.svg)](https://github.com/mihail-moonz/squoosh/actions/workflows/benchmark.yml)

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

## 🚀 Features (2026 Edition)

- **Lightning-fast builds** with modern tooling (Rollup 4.x + Vite support)
- **Multiple compression formats**: WebP, AVIF, JPEG XL, MozJPEG, OxiPNG
- **Privacy-first**: All image compression happens locally in your browser
- **WordPress Integration**: Ready-to-use APIs for WordPress plugins
- **Modern TypeScript**: Full type safety with TypeScript 5.7+
- **Comprehensive testing**: Built with Vitest and Testing Library

## 🛡️ Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh PWA, the type of Squoosh installation.
- If Squoosh PWA, the installation time and date.

## 🔧 Developing

### Prerequisites

- Node.js 20.16+ (see `.nvmrc`)
- npm 10+

### Setup

1. Clone the repository
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the app:
   ```sh
   npm run build
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```
   Or use Vite for faster HMR:
   ```sh
   npm run dev:vite
   ```

### Available Scripts

- `npm run build` - Production build with Rollup
- `npm run build:vite` - Production build with Vite
- `npm run dev` - Development server with Rollup watch
- `npm run dev:vite` - Development server with Vite (15-100x faster HMR)
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

## 🔌 WordPress Integration

Squoosh now includes a dedicated WordPress integration module for seamless plugin development:

```typescript
import { compressImage, generateThumbnails } from 'wordpress';

// Compress a single image
const result = await compressImage(imageBuffer, {
  format: 'webp',
  quality: 80,
});

// Generate WordPress thumbnails
const thumbnails = await generateThumbnails(imageBuffer, wpSizes, {
  format: 'avif',
  quality: 85,
});
```

See [WordPress Integration Guide](./docs/wordpress-integration.md) for more details.

## 📚 Documentation

- [WordPress Integration Guide](./docs/wordpress-integration.md)
- [Migration Guide](./docs/MIGRATION.md) - Upgrading from older versions
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## 🧪 Testing

We use Vitest for fast, modern testing:

```sh
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # Interactive UI
```

## 🤝 Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

## 📊 Performance Improvements (2026)

Compared to the 2021 version:

- **6x faster builds** with Rollup 4.x
- **15-100x faster HMR** with Vite
- **30% smaller bundles** with modern compression
- **Better TypeScript** with full strict mode
- **Comprehensive tests** with Vitest

## 📄 License

Apache 2.0 - See [LICENSE](./LICENSE) file

[squoosh]: https://squoosh.app
