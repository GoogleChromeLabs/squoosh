# Codec modernization plan

Status: written 2026-11-01. Phases 1 and 2 are done (the app now ships 16 wasm
files, ~12 MB); phases 3 and 4 are open.

## Summary

- **Decoding is already native-first.** `decodeImage` in
  `src/composables/useCompressor.ts` only falls back to a wasm decoder when
  the browser can't decode the format. AVIF and WebP decoding is now
  universal, so those two wasm decoders can go. JPEG XL decoding is arriving
  in browsers but isn't universal yet, so its wasm decoder stays as a lazy
  fallback for now.
- **Encoding can't move to the browser in general.** Browsers only encode
  PNG, JPEG and (not everywhere) WebP, with a single quality knob. Squoosh's
  point is the codec settings (MozJPEG trellis, OxiPNG effort, AVIF/JXL
  tuning) and identical output in every browser, so the wasm encoders stay.
  What native encoding is good for: extra "Browser …" encoders, shown only
  where the browser supports them.
- **The real work is upgrading the wasm codecs.** Most are 2–6 years old and
  built with Emscripten 2.0.34 (2021) and Rust 1.47 (2020).
- **WebP v2 should go.** It's an experimental format with no browser support,
  labelled "(unstable)" in the UI, and accounts for ~3.4 MB of wasm.

Together, dropping WebP v2, the two universal decoders and the non-SIMD
variants takes the wasm the service worker caches from ~17.5 MB to ~12 MB.

## What the app ships today

| Codec          | Pinned version           | Latest upstream               | Wasm files (kB)                                     |
| -------------- | ------------------------ | ----------------------------- | --------------------------------------------------- |
| MozJPEG        | 3.3.1 (2018)             | 4.1.1                         | enc 252                                             |
| libavif + aom  | 1.0.1 + aom 3.7.0 (2023) | 1.4.2 (May 2026) + aom 3.15.x | dec 1,211; enc 2,818; enc_mt 2,872                  |
| libjxl         | commit of 2022-01-18     | 0.12.0 (Jul 2026)             | dec 840; enc 1,346; enc_mt 1,358; enc_mt_simd 1,946 |
| libwebp        | commit of 2020-11-24     | 1.6.0                         | dec 149; enc 298; enc_simd 372                      |
| libwebp2       | experimental commit      | still experimental            | dec 459; enc 972; enc_mt 981; enc_mt_simd 1,023     |
| OxiPNG         | 9.0                      | 10.2.1 (Sep 2026)             | 147; parallel 220                                   |
| libimagequant  | 2.12.1                   | 4.4.1                         | 66                                                  |
| QOI            | commit (2021)            | format is frozen              | dec 16; enc 17                                      |
| resize (crate) | 0.5.5                    | newer releases exist          | 37                                                  |
| hqx            | wasmboy-rs v0.1.3        | unmaintained                  | 153                                                 |

Toolchains: `codecs/cpp.Dockerfile` uses `emscripten/emsdk:2.0.34`,
`codecs/rust.Dockerfile` uses Rust 1.47 with Emscripten 2.0.8 tools, and the
Rust codecs use wasm-bindgen 0.2.38–0.2.73.

`codecs/png` (124 kB) and `codecs/visdif` (59 kB) aren't imported by the app
any more and can be deleted.

## What browsers support natively

Checked directly in the Claude browser pane (Chrome 152) where marked ✓;
everything else is from reports and should be re-checked in each browser
before relying on it.

| Format  | Decode                                                                                                                  | Encode via `canvas.toBlob` / `convertToBlob`                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| PNG     | All ✓                                                                                                                   | All ✓ (no compression settings)                                                                            |
| JPEG    | All ✓                                                                                                                   | All ✓ (quality only)                                                                                       |
| WebP    | All ✓                                                                                                                   | Chrome ✓, Firefox; not Safari (tested 2026-11-01: silently returns JPEG; the app hides Browser WebP there) |
| AVIF    | All ✓                                                                                                                   | Not in Chrome ✓ (falls back to PNG); one report says WebKit 26.5 encodes it, unconfirmed                   |
| JPEG XL | Safari 17+; Chrome 155 (Oct 2026, on by default, Rust jxl-rs decoder); Firefox ~157/158 by default; not in Chrome 152 ✓ | None ✓                                                                                                     |
| QOI     | None ✓                                                                                                                  | None ✓                                                                                                     |
| WebP v2 | None ✓                                                                                                                  | None ✓                                                                                                     |

Other APIs:

- **WebCodecs `ImageDecoder`** (Chrome/Edge, Firefox 133+, not in Safari per
  MDN data) adds nothing over `createImageBitmap` for still images.
- **There is no `ImageEncoder`** ✓.
- **`VideoEncoder` can encode AV1** in Chrome ✓. An AVIF is a single AV1 frame
  in an HEIF container, so this could in theory make a native AVIF encoder,
  but with far less control than libavif and a container to write ourselves.
  Not worth it now.

## Plan

Each step is its own PR, and each codec upgrade is verified the same way (see
"Verification" below).

### Phase 1: Use native where it's equivalent (done)

1. **Remove the wasm AVIF and WebP decoders.** Every supported browser decodes
   both. Drop `features/decoders/{avif,webp}`, their worker methods, and
   `codecs/avif/dec` and `codecs/webp/dec`. Saves 1.36 MB of wasm.
2. **Keep the JPEG XL wasm decoder as a lazy fallback.** It's only loaded when
   the browser can't decode JXL itself, which is already how `decodeImage`
   works. Revisit in 2027 once Edge, older Chrome and Firefox ESR have caught
   up.
3. **Generic browser encoders.** Turn Browser JPEG/PNG into one feature-tested
   family and add Browser WebP and Browser AVIF. Each appears in the encoder
   menu only if `convertToBlob` returns that type (checking `blob.type`,
   since unsupported types silently become PNG). The registry needs a
   `featureTest` again, run once at startup. Useful to compare what browsers
   produce, and cheap to keep.

### Phase 2: Drop what isn't worth keeping (done)

4. **Remove WebP v2** (encoder, decoder, `codecs/wp2`). It's experimental, has
   no browser support and saves 3.4 MB. Saved side settings that use `wp2`
   already fall back to "Original image".
5. **Delete `codecs/png` and `codecs/visdif`**, which nothing imports.

### Phase 3: Modernize the toolchain

6. **Update the Docker build images:** current Emscripten (4.x) and current
   stable Rust with a current wasm-bindgen and wasm-bindgen-rayon. Rebuild
   every codec once at its current pinned version, and check the output
   sizes still match. That separates toolchain effects from codec changes.
   The new wasm-bindgen glue is also the first thing to try for the
   unreproduced `RangeError: offset is out of bounds` in the resize worker.
7. **Ship SIMD-only builds.** Wasm SIMD works in every supported browser
   (Chrome 91, Firefox 89, Safari 16.4). Keep the threaded/single-threaded
   split, because threads need cross-origin isolation, which some hosts
   (like GitHub Pages) can't provide. Variants per encoder become `simd` and
   `mt_simd`. Removes `webp_enc` and `jxl_enc_mt`, and adds a single-threaded
   SIMD JXL build.

### Phase 4: Upgrade the codecs (one PR each)

8. **MozJPEG 3.3.1 → 4.1.x.** No new UI options needed. Expect slightly
   different sizes at the same quality.
9. **libwebp → 1.6.0.** Five years of encoder improvements. Check whether the
   option defaults changed.
10. **libavif 1.0.1 → 1.4.x, aom 3.7 → 3.15.x.** Newer aom has an
    image-quality tuning for still images; evaluate it as a new "Tuning"
    option or the default. Consider adding the SVT-AV1 encoder only if it
    measurably beats aom for stills.
11. **libjxl → 0.12.0.** The encoder API changed a lot since 2022, so the
    C++ glue in `codecs/jxl/enc` needs rewriting, and the options panel may
    gain or lose settings (e.g. the old "Alternative lossy mode"). The
    decoder fallback should follow the same version.
12. **OxiPNG 9 → 10.x.** Check whether option names or levels changed.
13. **libimagequant 2.12 → 4.x.** Version 4 is a Rust rewrite with a C API.
    It is GPL-3.0-or-later like 2.12, but confirm the licence terms before
    upgrading.
14. **resize and hqx crates:** update `resize`; hqx is unmaintained, so only
    rebuild it with the new toolchain.

### Verification for every codec change

- Encode the four demo images with default settings, and a few non-default
  ones per encoder, before and after. Record sizes in the PR.
- Compare quality, not just size: the same file size with a better score is
  a win. Use an external metric (SSIMULACRA2 or butteraugli) on the decoded
  outputs; the unused `visdif` codec isn't needed for that.
- Check that saved side settings from the current version still load
  (options may have been added, renamed or removed; `sanitizeSideSettings`
  fills in defaults but can't translate renamed options).
- Run the app offline once, to make sure the service worker caches the new
  wasm names.

## Open questions

- Should the default encoder stay MozJPEG, or move to AVIF now that every
  browser decodes it?
- Does Safari encode AVIF from a canvas? One report says WebKit 26.5 does.
  (It does not encode WebP: tested, it silently returns JPEG.)
- Keep QOI? It's tiny (33 kB) and has no native support either way.
