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

## Current state of the branch

Steps 1–7 of the original plan are done (one commit each on this branch):
the codec typings and worker imports, the worker entry and bridge
(`src/worker`), the `useCompressor` pipeline with an explicit registry
(`src/features/registry.ts`), the Vue UI, the Workbox service worker
(`src/sw.ts`), and the clean-up of the Preact/Rollup code and dependencies.
`bun run build` and `bun run typecheck` pass. See
[src/features/README.md](../src/features/README.md) for the code layout.

Things that work differently from the old app, on purpose:

- Settings changes are detected by comparing serialized settings, which fixes
  the `processorStateEquivalent` bug. Disabled processors' options no longer
  trigger work.
- Each side remembers which settings its processed image came from, so rapid
  edits can't encode a stale resized image.
- Output file names: `photo` becomes `photo.jpg` (it used to become `.jpg`).
- Stored side settings are sanitised: unknown encoders (`browserGIF`) fall
  back to "Original image", and missing options get defaults.
- Key 2 centres the split (it used to go to 25 %).
- Reloading on `/editor` goes back to `/`.
- The service worker precaches the app (~1.2 MB) and caches all 22 codec wasm
  files (~17 MB) when the editor first opens, instead of only the variants
  the browser supports. People who used the editor get new codecs on update.
  `idb-keyval` is gone.
- The two stub service workers from `src/copy` (for very old squoosh.app
  installs) are not carried over. `public/_headers` and `public/_redirects`
  replace `serve.json` and `src/copy/_redirects`.

Already verified in the browser pane on macOS: every encoder and processor
setting against squoosh.app (sizes below), the intro and editor side by side
with squoosh.app, zoom/pan/wheel, the split handle and keys 1/2/3, rotate,
smoothing and background toggles, copy/save/import with undo, the mobile
multi-panel, back/forward, drag & drop, paste, offline after the first visit,
the update prompt and the share target.

Not verified yet: clicking through the resize and palette panels in the UI,
two-finger pinch on a touch device, Safari, Firefox, the install button and
the Konami easter egg.

## Remaining plan

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
