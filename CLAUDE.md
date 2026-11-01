# Squoosh (Pinguin2001 fork)

Image compression web app. This fork rewrote the UI from Preact + Rollup to
**Vue 3 + Vite + TypeScript** (branch `vue-rewrite`, based on `dev`) and is
modernizing the codecs. Owner: Julian (`Pinguin2001` on GitHub, remote
`origin`; `upstream` is GoogleChromeLabs/squoosh and is never pushed to).

Planned hosting: Cloudflare Pages at `squoosh.julianhasreiter.eu` (needs the
COOP/COEP headers from `public/_headers`; GitHub Pages can't send them).

## Commands

```sh
bun install --frozen-lockfile
bun run dev        # Vite on :5000, sends COOP/COEP
bun run build      # vue-tsc -b && vite build → dist/
bun run preview    # serves dist/ incl. the service worker, :5000
bun run typecheck  # vue-tsc -b
```

`.claude/launch.json` has `dev` and `preview` for the browser pane. If a build
fails inside `workbox-build` (lru-cache / path-scurry), the node_modules tree
is stale: `rm -rf node_modules && bun install --frozen-lockfile`.

## Layout

- `src/App.vue`: intro vs editor, `/editor` pushState + popstate, drag & drop
  and paste anywhere, share target, SW registration.
- `src/components/`: `controls/` (Checkbox, Toggle, Revealer, Select, Range,
  Expander; all `v-model`), `editor/` (CompressView, ImageOutput,
  ResultsBubble, OptionsPanel, MultiPanel), `intro/`, SnackBar,
  LoadingSpinner, `icons.ts` (render functions).
- `src/composables/`: `useCompressor` (the whole image pipeline),
  `usePanZoom`, `useSnackbar` (`showSnack` is a plain import),
  `useDerivedOptions`, `useMediaQuery`.
- `src/features/`: per codec `meta.ts` (options + defaults), `worker.ts`
  (runs in the web worker), `Options.vue`. `registry.ts` lists every
  encoder/processor; `options-components.ts` maps encoders to panels.
  `src/features/README.md` explains adding an encoder.
- `src/worker/index.ts` exposes all worker functions via comlink;
  `src/worker/bridge.ts` (WorkerBridge: queue, abort, 10 s idle timeout) has
  an explicit `methodNames` list that must match (compile-time checked).
- `src/sw.ts`: Workbox service worker (injectManifest).
- `codecs/`: prebuilt wasm codecs, committed, built with Docker.
- `docs/vue-rewrite-handoff.md` (rewrite status, verification yardstick) and
  `docs/codec-modernization-plan.md` (codec plan; phases 1–3 done, 4 open).

## How things work (non-obvious)

- **Settings are edited in place** (Vue reactive). `useCompressor` detects
  changes by comparing serialized settings (`JSON.stringify`); disabled
  processors are left out of the key. The result cache uses the same keys.
  Defaults in `registry.ts` are factory functions so nothing shares objects.
- **`encoderMap` keys are stored in saved side settings** (localStorage
  `leftSideSettings` / `rightSideSettings`): never rename them. Stored
  settings are sanitized; unknown/unsupported encoders load as "Original
  image".
- **Decoding is native-first**: AVIF and WebP only via the browser; JPEG XL
  and QOI have wasm fallbacks that load only when the browser can't decode.
- **Browser encoders** (Browser AVIF/JPEG/PNG/WebP) are feature-tested with
  a 1×1 `toDataURL` probe and hidden when unsupported. Browsers silently fall
  back to PNG (or JPEG in Safari) for unsupported types; `canvasEncode`
  throws on that. Safari has no Browser WebP; Chrome has no Browser AVIF.
- **Multithreaded codecs need `crossOriginIsolated === true`**, otherwise
  they silently use the single-threaded builds.
- Codecs are imported dynamically in workers so the worker starts without
  them. Type-only imports use `import type` (`verbatimModuleSyntax`).
- **Service worker**: precaches the build except `.wasm`; wasm is cached
  cache-first and all at once when the editor opens (`CACHE_ALL` message);
  pruned on activate. Demo images cached at runtime. Update prompt via
  `virtual:pwa-register`. The SW only runs in `preview`/production.
- Scoped CSS uses native nesting; class names are kebab-case copies of the
  old CSS modules. Shared option styles and side themes are global
  (`src/styles/options.css`).

## Building codecs

Needs Docker. On this Mac: Colima (`colima start --cpu 8 --memory 8
--vm-type vz --vz-rosetta`; `colima stop` when done). Build a codec with
`cd codecs/<name> && ../build-cpp.sh` (C++) or `../build-rust.sh [./build.sh]`
(Rust). Images: Emscripten 6.0.13 (`codecs/cpp.Dockerfile`), Rust 1.99 +
nightly-2026-10-01 for threaded OxiPNG (`codecs/rust.Dockerfile`,
`codecs/oxipng/rust-toolchain`). Make only rebuilds missing outputs: delete
the `.js` output to relink, or the codec's `node_modules/.../build` dir to
reconfigure. `chmod 644` the `.wasm` files afterwards (the container makes
them executable). Pitfalls already solved, keep them:

- Links use `emcc`, so `LDFLAGS` has `-s DEFAULT_TO_CXX`.
- `-s STACK_SIZE=5MB -s DEFAULT_PTHREAD_STACK_SIZE=2MB`: with the 64 KB
  default libaom overflows and threaded AVIF throws `unwind`.
- SIMD builds must compile **and link** with `-msimd128` or LTO drops SIMD
  silently. Verify: `wasm-dis --all-features x.wasm | grep -c v128` (> 0).
- autoconf (MozJPEG): `emconfigure ./configure --host=wasm32-unknown-emscripten`.
- Use `$(AR)`, not `llvm-ar` (not on PATH).
- Threaded Rust needs the shared-memory link args in `codecs/oxipng/build.sh`.
- Only SIMD builds are shipped (WebP, JPEG XL); threaded/single-threaded
  split stays because threads need cross-origin isolation.

## Verifying changes

- The yardstick is squoosh.app opened **in the same browser/OS** (SVG
  rasterization differs between Windows and macOS). Logo demo, defaults, in
  the macOS browser pane, exact bytes: AVIF 8461, JPEG XL 20302, MozJPEG
  18788, OxiPNG 29267, QOI 40566, WebP 14218, Browser WebP ~16.0 kB;
  OxiPNG + reduce palette 17586, + resize 50 % Lanczos3 17554, hqx 14879.
  Codec rebuilds without version changes must stay byte-identical.
- Drive the UI with real input events in the browser pane; Vite reloads
  the page whenever files under `codecs/` change (scripts get cut off).
- The pane's main tab emulates dark mode, which makes the page background
  look dark; use `resize_window colorScheme: light` + reload to compare.
- Unregister service workers and clear caches when switching between
  `dev` and `preview` on port 5000.

## Open items

- Codec plan phase 4: upgrade MozJPEG 3.3.1→4.1, libwebp→1.6, libavif
  1.0.1→1.4 / aom 3.7→3.15, libjxl (2022 commit)→0.12 (encoder glue needs a
  rewrite), OxiPNG 9→10, libimagequant 2.12→4.x (check licence). One PR
  each, compare output quality not just size.
- Unreproduced: a `RangeError: offset is out of bounds` in the resize worker
  and one oversized Lanczos result, both after very large hqx resizes.
- Not tested: Safari/Firefox after the codec rebuild, two-finger pinch on
  touch devices, the install button.

## Working with Julian

- Commit only when asked; one commit per step, messages like
  `wip: …` during the rewrite, descriptive subject + bullet body. End with
  the Co-Authored-By line.
- Keep the look and behaviour of the original app 1:1 unless agreed.
- No analytics. Decisions so far are recorded in the two docs above.
