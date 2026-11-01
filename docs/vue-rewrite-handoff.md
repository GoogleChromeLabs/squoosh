# Vue rewrite: handoff notes

Work-in-progress notes for rebuilding the Squoosh UI on Vue 3 + Vite. Branch:
`vue-rewrite` (based on `dev` at `faad556e`, the Bun/dependency modernization).
Delete this file once the rewrite is merged.

## Goal

Replace the Preact UI, custom elements and hand-written Rollup pipeline with a
Vue 3 + Vite + TypeScript app that is simpler to maintain, while keeping the
codecs and the image-processing behaviour exactly as they are. Clear out tech
debt along the way.

## Decisions (agreed with the owner)

| Topic         | Decision                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Framework     | Vue 3 (`<script setup>`, Composition API), Vite, TypeScript              |
| Analytics     | **Remove** Google Analytics entirely (update the README privacy section) |
| Offline / PWA | **Keep**, via `vite-plugin-pwa` (installable, offline, share target)     |
| Design        | **Keep the current look** and interactions 1:1                           |
| Prerendering  | **Drop**; plain SPA                                                      |

Choices I made that weren't asked about (change them if you disagree):

- No vue-router and no Pinia: there are only two views (intro, editor), and the
  state lives in one composable. Navigation keeps the old `/editor` pushState
  plus popstate behaviour.
- Drop the `browserGIF` encoder. Its feature test fails in every current
  browser, so it is never shown.
- Replace the custom elements (`pinch-zoom`, `two-up`, `multi-panel`,
  `range-input`, `snack-bar`, `loading-spinner`) with Vue components.
- Replace the generated files from `lib/feature-plugin.js` with an explicit,
  hand-written codec registry.

## Proven: multithreaded codecs work under Vite

A throwaway prototype (deleted again) ran AVIF MT/ST, JXL MT, OxiPNG
MT/ST and WebP in a Vite **module** worker (`worker: { format: 'es' }`) and
served them with the COOP/COEP headers. All of them worked, and MT output was
byte-identical to ST. Notes:

- Vite picks up Emscripten's `new Worker(new URL('x.worker.js', import.meta.url))`
  and wasm-bindgen-rayon's self-spawning `workerHelpers.js` without help.
- Each MT codec's JS gets bundled twice: once for the main worker, once inside
  its pthread worker, which `import()`s it. It works and the cost is small, so
  leave it.
- The worker pattern that worked:
  `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`
  with comlink `wrap`/`expose`.

## Current state of the branch (doesn't build yet)

Done:

- Installed: `vue`, `vite@8`, `@vitejs/plugin-vue`, `vue-tsc`, `@vue/tsconfig`,
  `vite-plugin-pwa@2`, `workbox-window`, `workbox-precaching`,
  `workbox-routing`, `workbox-strategies`.
- `vite.config.ts`: Vue plugin, PWA plugin (`injectManifest`, `srcDir: 'src'`,
  `filename: 'sw.ts'`, full manifest incl. screenshots and `share_target`),
  aliases `@` → `src`, `codecs` → `codecs`, COOP/COEP headers for
  dev/preview, `worker.format: 'es'`, port 5000.
- `index.html` at the root, entry `/src/main.ts` (not written yet).
- tsconfigs: `tsconfig.json` (references only), `tsconfig.app.json` (DOM, Vue,
  `paths` for `@/*` and `codecs/*`, excludes `src/sw.ts`), `tsconfig.sw.json`
  (WebWorker lib, `src/sw.ts`), `tsconfig.node.json` (`vite.config.ts`). The
  four old tsconfigs are removed.
- Moved with `git mv` (history kept):
  - `src/features/<kind>/<name>/shared/meta.ts` → `src/features/<kind>/<name>/meta.ts`
  - `src/features/<kind>/<name>/worker/*.ts` → `src/features/<kind>/<name>/worker.ts`
    (decoders, encoders, processors, preprocessors)
  - `src/features/processors/resize/shared/util.ts` → `.../resize/util.ts`
  - `src/features/worker-utils/index.ts` → `src/features/worker-utils.ts`
  - `src/worker-shared/supports-wasm-threads.ts` → `src/features/supports-wasm-threads.ts`
  - `src/client/lazy-app/util/canvas.ts` → `src/lib/canvas.ts`
  - `src/client/lazy-app/util/index.ts` → `src/lib/util.ts`
  - `src/client/lazy-app/Compress/result-cache.ts` → `src/lib/result-cache.ts`
  - `src/client/lazy-app/worker-bridge/index.ts` → `src/worker/bridge.ts`
  - `src/shared/prerendered-app/Intro/blob-anim/` → `src/components/intro/blob-anim/`
  - `src/shared/prerendered-app/Intro/imgs/` → `src/components/intro/imgs/`
  - `src/static-build/assets/{favicon.ico,icon-*.png}` → `public/`
  - `src/static-build/assets/screenshot*` → `public/screenshots/`
  - The duplicate root `icon-large-maskable.png` is deleted.

Not done (everything else). The old Preact sources are still in place as a
reference (`src/client`, `src/shared`, `src/static-build`, `src/sw`,
`src/features-worker`, `src/features/**/client/`, `src/copy`). Delete them once
their replacements exist.

## Remaining plan

### 1. Fix things the moves broke

- **The codec `const enum`s still need converting.** Vite compiles each file
  on its own and can't inline enums declared in `.d.ts` files, so they'd be
  `undefined` at runtime. Replace them:
  - `codecs/avif/enc/avif_enc.d.ts`: `AVIFTune` → `export type AVIFTune = 0 | 1 | 2;`
    (auto, psnr, ssim)
  - `codecs/mozjpeg/enc/mozjpeg_enc.d.ts`: `MozJpegColorSpace` →
    `export type MozJpegColorSpace = 1 | 2 | 3;` (grayscale, RGB, YCbCr)
  - `codecs/wp2/enc/wp2_enc.d.ts`: `UVMode` → `0 | 1 | 2 | 3` (adapt, 420,
    444, auto); `Csp` → `0 | 1 | 2 | 3` (YCoCg, YCbCr, custom, YIQ)
  - Then define value objects in the matching `meta.ts`, for example
    `export const AVIFTune = { auto: 0, psnr: 1, ssim: 2 } as const;`
- `@vue/tsconfig` turns on `verbatimModuleSyntax`. Type re-exports such as
  `export { EncodeOptions }` in the meta files must become `export type { ... }`,
  and type-only imports must use `import type`.
- Update imports in the moved worker files: `features/worker-utils` →
  `@/features/worker-utils`, `worker-shared/supports-wasm-threads` →
  `@/features/supports-wasm-threads`, `../shared/meta` → `./meta`. `codecs/...`
  stays the same (alias).
- `src/features/preprocessors/rotate/worker.ts` imports
  `url:codecs/rotate/rotate.wasm`. Use `codecs/rotate/rotate.wasm?url`.
- Make all codec imports in worker files dynamic (`await import(...)`). Today
  some decoders, mozjpeg, imagequant and resize are imported statically, which
  makes the single worker bundle load all their JS on start.
- Delete the leftover `missing-types.d.ts` files under `src/features/**`.

### 2. Target layout

```
index.html, vite.config.ts, tsconfig*.json
public/            _headers (COOP/COEP + no-cache), _redirects (/editor / 301), icons, screenshots
src/
  main.ts          createApp(App), import global CSS
  App.vue          intro vs editor, file drop, share target, snackbar, PWA update prompt
  sw.ts            service worker (injectManifest)
  styles/          global CSS: colors, base, util (.unbutton, .abs-fill), option styles
  lib/             util.ts, canvas.ts, result-cache.ts, pretty-bytes, abort helpers
  worker/          index.ts (comlink expose of all worker funcs), bridge.ts (WorkerBridge)
  features/
    registry.ts    explicit encoder list: meta + encode() + featureTest + Options component
    encoders/<name>/{meta.ts, worker.ts, client.ts, Options.vue}
    decoders/<name>/worker.ts
    processors/{resize,quantize}/{meta.ts, worker.ts, client.ts?, Options.vue}
    preprocessors/rotate/{meta.ts, worker.ts}
  composables/     useCompressor.ts (pipeline), usePanZoom.ts, useSnackbar.ts, useMediaQuery.ts
  components/
    controls/      Expander, Toggle, Select, Revealer, Checkbox, Range (replaces range-input)
    editor/        CompressView, ImageOutput (pan/zoom + split), ResultsBubble, OptionsPanel, MultiPanel
    intro/         IntroPage, SlideOnScroll, blob-anim/, imgs/
    SnackBar.vue, LoadingSpinner.vue, icons
```

### 3. Worker layer

- `src/worker/index.ts` exposes, via comlink, every worker function (the old
  generated `src/features-worker/index.ts`, with method names `avifEncode`,
  `webpDecode`, `rotate`, `resize`, `quantize`, ...), wrapped in the `timed()`
  console timing from `src/features-worker/util.ts`.
- `src/worker/bridge.ts`: keep the queue, abort and idle-timeout logic. Create
  the worker with `new Worker(new URL('./index.ts', import.meta.url), { type: 'module' })`.
  Replace the generated `methodNames` with an explicit list, or a typed Proxy.

### 4. Processing pipeline (`useCompressor`)

Port `src/client/lazy-app/Compress/index.tsx` (`updateImage`, `decodeImage`,
`processImage`, `compressImage`, `processSvg`, side settings, copy to the
other side, save and import of side settings in localStorage under
`leftSideSettings` and `rightSideSettings`, document title `⏳` indicator, one
WorkerBridge per side, debounce of 100 ms, result cache).

- Vue settings are reactive and change in place. Detect changes by comparing
  serialized snapshots (`JSON.stringify` of preprocessor, processor and
  encoder state) instead of the old object-identity checks. Use the same keys
  for `ResultCache`.
- **Bug to fix:** `processorStateEquivalent` compares `a !== b` inside the
  loop instead of `a[key]` and `b[key]`, so it barely ever reports two states
  as equal.
- Keep `ImageData`, `File` and `HTMLImageElement` out of deep reactivity
  (`shallowRef` / `markRaw`).

### 5. UI components (keep the current CSS)

The old CSS uses CSS modules with kebab-case class names and native-style
nesting (`&`); no `$vars`. Copy it into `<style scoped>` blocks under the
same kebab names. The shared option styles
(`src/client/lazy-app/Compress/Options/style.css`) become a global stylesheet,
because every encoder's options panel uses them.

- **ImageOutput** replaces `two-up` + 2× `pinch-zoom` + event retargeting:
  one container, **one** transform state (scale/x/y via `DOMMatrix`) applied
  to both canvases, a split handle with `clip-path`, pointer events for
  pan/pinch, wheel zoom (logic from `PinchZoom/index.ts`, `_onWheel` /
  `_applyChange` / `setTransform` bounds). That removes `pointer-tracker` and
  the retargeting hack. Keep: zoom buttons and editable %, rotate, toggle
  smoothing (not on Safari), toggle background, keys 1/2/3 for the split
  position, vertical orientation on mobile, recentring when the source size
  changes, and the transform reset when the file changes.
  - **Bug to fix:** key `2` sets `_relativePosition` to `pos / dim / 2` (0.25)
    instead of 0.5.
- **MultiPanel** (mobile, width ≤ 599 px): an accordion, open-one-only, with
  arrow/Home/End keyboard navigation and a 300 ms height transition.
- **Expander**: animated height on enter and leave; Vue `<Transition>` with
  JS hooks can do this, using `transitionHeight` in `lib/util.ts`.
- **Range**: label, a hidden native range input, a custom thumb with a value
  bubble while dragging, and an editable number field (see `RangeInput`
  styles).
- Encoder option panels: port each `client/index.tsx` to `Options.vue` with
  `v-model` (`defineModel<EncodeOptions>()`). The AVIF, JXL and WP2 panels
  keep a derived UI state (lossless, separate alpha, effort = 10 − speed, ...);
  move that logic into a computed or a local reactive copy. WebP lossless
  presets: keep `losslessPresets` and `determineLosslessQuality`. Quantize:
  the "ZX" type only shows after the Konami code (`konami()` in `lib/util.ts`).
  Resize: presets, maintain aspect, the vector method only for SVG, and
  premultiply / linear RGB only for worker methods.
- **Intro**: the demo list, file picker, paste button (clipboard API), install
  button (`beforeinstallprompt`, no analytics), blob canvas animation (skip
  with `prefers-reduced-motion`; the SVG fallback uses `startBlobs`),
  SlideOnScroll (IntersectionObserver), waves and footer. Footer links point
  at `https://github.com/Pinguin2001/squoosh` (the owner's fork) instead of
  GoogleChromeLabs.
- **App**: file drop over the whole app (replaces `file-drop-element`),
  `gesturestart` preventDefault for iOS, `/editor` pushState and popstate,
  starting on `/editor` without a file goes back to `/`, the share target
  (`?share-target`: post `share-ready` to the SW and wait for the
  `load-image` message), snackbar queue (`showSnack(message, { timeout,
actions }) → Promise<action>`).

### 6. Service worker (`src/sw.ts`)

- Precache everything from `self.__WB_MANIFEST` **except `.wasm`**
  (precaching ~15 MB on install is too much). Cache `.wasm` with a
  CacheFirst route (the files are hashed) and fetch all of them when the page
  posts `cache-all`. Send that the first time the editor opens, as the old
  `mainAppLoaded()` did. Prune old wasm entries.
- Demo images (`/assets/demo-*`) are left out of the precache by
  `globIgnores`. Cache them at runtime (CacheFirst).
- Share target: a POST route for `/?...share-target` that reads the form
  data, redirects to `/?share-target`, waits for the page's `share-ready`
  message, then posts `{ action: 'load-image', file }` (port from
  `src/sw/util.ts`).
- Navigation route to `index.html` (SPA).
- Handle `{ type: 'SKIP_WAITING' }` (sent by `virtual:pwa-register`'s
  `updateSW(true)`). In the app, `registerSW({ onNeedRefresh, onOfflineReady })`
  shows the snacks "Update available" (reload/dismiss) and "Ready to work
  offline".

### 7. Clean-up once the new app runs

- Delete: `rollup.config.js`, `lib/`, `serve.json`, `missing-types.d.ts`,
  `bunfig.toml` (only needed for running rollup and tsc under Bun), the old
  `src/` trees listed above, and `.claude/launch.json` entries that no longer
  apply.
- Remove these dependencies: rollup and all `@rollup/*`,
  `@surma/rollup-plugin-off-main-thread`, `@web/rollup-plugin-import-meta-assets`,
  postcss, `postcss-*`, cssnano, glob, image-size, mime-types,
  `@types/mime-types`, `lodash.camelcase`, linkstate, pointer-tracker, preact,
  preact-render-to-string, file-drop-element, dedent, serve. Keep comlink and
  wasm-feature-detect. Drop idb-keyval unless the SW still needs it.
- `package.json` scripts: `dev: vite`, `build: vue-tsc -b && vite build`,
  `preview: vite preview`, `typecheck: vue-tsc -b`.
- `.gitignore`: add `dist`; remove the old generated-file entries and
  `*.css.d.ts`.
- README: dev instructions, privacy section without Google Analytics.
- CI (`.github/workflows/ci.yml`) already runs `bun run build`; keep it.

### 8. Verification

The yardstick is squoosh.app itself, opened in the **same browser on the same
OS**. The sizes depend on the platform: Chrome rasterizes the SVG differently
on Windows and macOS, so even the lossless encoders differ. On the "logo" demo
(`squoosh.svg`) with default options:

| Encoder      | Windows | macOS (browser pane) |
| ------------ | ------- | -------------------- |
| OxiPNG       | 45.1 kB | 29.3 kB              |
| AVIF         | 8.27 kB | 8.46 kB              |
| JPEG XL      | 19.9 kB | 20.3 kB              |
| WebP v2      | 9.54 kB | 9.76 kB              |
| WebP         | 14.1 kB | 14.2 kB              |
| MozJPEG      | 18.8 kB | 18.8 kB              |
| QOI          | 51.1 kB | 40.6 kB              |
| Browser PNG  | 80.9 kB | 61.7 kB              |
| Browser JPEG | 23.0 kB | 23.1 kB              |

Processors on OxiPNG: reduce palette gave 21.5 kB (Windows) / 17.6 kB
(macOS). Adding resize to 50 % with Lanczos3 gave 17.8 / 17.6 kB, and with
hqx 15.6 / 14.9 kB.

The `useCompressor` pipeline already matched every macOS number above in a
test page (before any UI existed); the finished app still needs checking.

Also check: the intro page, demos, paste, drag & drop, split slider and keys
1/2/3, zoom/pan/wheel, rotate, mobile layout (multi-panel), copy, save and
import of side settings, download, offline after the first visit, the update
prompt, and `bun run typecheck`.

Tips from the previous session:

- `crossOriginIsolated` must be `true`, otherwise the MT codecs silently fall
  back to ST.
- Clear old service workers when switching between builds on the same port.
  An old SW once served the previous app.
- On Windows the Claude browser pane couldn't start nested workers on an
  uncontrolled localhost page, and it needed a per-origin approval for each
  new port. Neither should happen on macOS.
- `python3` on Windows opens the Microsoft Store stub and hangs; use `bun -e`
  for scripted edits.
