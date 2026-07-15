# BEN2 background removal: design, evidence, and remaining spikes

> **Status:** temporary engineering design for a query-gated spike. This is not a
> production implementation or a release approval.
>
> **Branch:** `spike/ben2-ort-webgpu-netlify`
>
> **Baseline:** Squoosh `dev` at
> `e8d35e0fb66eb16eff6fe8fc773eabcbb7128de3`
>
> **Last evidence update:** 2026-07-15

This document records the complete design we intend to implement, the evidence
behind it, the disposable spike code currently on the branch, the approaches we
rejected, and the browser/deployment spikes that must still run before this can
be considered for production.

The intended feature removes an image background locally with BEN2. It must use
Squoosh's normal generated feature worker, existing `WorkerBridge`, existing
service worker, and existing versioned persistent cache. It must not create a
BEN2-specific worker architecture or depend on a model CDN at runtime.

## 1. Goals and non-goals

### Goals

- Offer local, high-quality background removal as one shared preprocessing
  operation in Squoosh.
- Preserve the original image dimensions and RGB values exactly; replace only
  the alpha channel with the BEN2 matte.
- Execute through Squoosh's generated feature worker and existing
  `WorkerBridge`.
- Download the pinned model lazily, only when the feature is used on a supported
  device.
- Emit all runtime assets as same-origin, content-hashed build artifacts.
- Persist successfully fetched immutable assets in the current
  `static-${VERSION}` service-worker cache so a later run can work offline.
- Cancel stale work through the existing `AbortSignal`/worker-termination path.
- Provide deterministic preprocessing and postprocessing with checked browser
  parity against committed goldens.
- Detect unsupported browsers/devices before downloading the model.
- Gather real browser latency and memory data before setting a product support
  policy.

### Non-goals

- No dedicated BEN2 worker or BEN2-specific `WorkerBridge`.
- No separate Cache Storage cache for BEN2.
- No runtime Hugging Face, Xet, CDN, or third-party asset request.
- No model binary in Git.
- No silent browser-WASM fallback. The bounded browser-WASM attempts were not a
  practical product path.
- No browser-name/version allowlist. Support is determined from capabilities
  and acceptance results.
- No machine-specific PanVK, Mesa, kernel, Dawn, or patched-ORT workaround in
  production.
- No quality slider or model options. The graph has one fixed input and one
  output.
- No silent encoder change. JPEG cannot preserve transparency; Squoosh must tell
  the user to choose PNG rather than changing the user's encoder behind their
  back.

## 2. Executive decisions

| Area            | Decision                                                                                                                                                                                                    | Why                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Model           | Pin `onnx-community/BEN2-ONNX` revision `c552aa82688edce09f0ac9d2e31ad53d9d629010`, path `onnx/model_fp16.onnx`.                                                                                            | This exact artifact was downloaded, parsed, checked, executed natively, and golden-tested.                              |
| Integrity       | Require 219,121,675 bytes and SHA-256 `dfdc25f421f32a0d1268e0f2ff2153d340e8f1d52d3dd16f5dc33c1ce85cedf1`.                                                                                                   | The local bytes, HTTP metadata, and Git LFS pointer agree.                                                              |
| Acquisition     | Download at build time from the immutable revision, verify while streaming, then atomically rename under ignored `.tmp/ben2/`.                                                                              | Keeps the model out of Git and removes all runtime model-host dependencies.                                             |
| Worker          | Use the ordinary generated features worker and the existing bridge passed into shared preprocessing.                                                                                                        | It already provides serialization, cancellation, reuse, and idle teardown.                                              |
| ORT             | Pin `onnxruntime-web@1.27.0`; import `onnxruntime-web/webgpu` with the external-WASM export condition and matching asyncify MJS/WASM pair.                                                                  | This is the only package combination that crossed the generated-worker loader and model boundary in the spike.          |
| Provider        | Product path is WebGPU only.                                                                                                                                                                                | Browser WASM stayed busy for bounded multi-minute runs and is not a usable fallback for this model.                     |
| Capability      | Require secure context, `navigator.gpu`, a real adapter selected with `forceFallbackAdapter: false`, `shader-f16`, and successful device creation with required `shader-f16`.                               | BEN2's graph generates f16 shaders; SwiftShader exposed WebGPU but failed at that requirement.                          |
| Pixel contract  | Decode straight RGB, ignore source alpha for inference, distort to 1024×1024, normalize with ImageNet constants, run NCHW float32, convert matte to u8 before resizing, preserve source RGB, replace alpha. | This matches the pinned candidate sidecar and Transformers.js 4.2.0 reference pipeline.                                 |
| Transparent PNG | Send encoded PNG bytes through the existing worker and existing PNG codec before any Canvas round-trip.                                                                                                     | Canvas compositing destroys hidden RGB under transparent pixels, and setting alpha to 255 afterwards cannot restore it. |
| Resize          | Use deterministic asymmetric bilinear sampling with zero-valued out-of-range neighbors for both model input and matte output.                                                                               | It reproduces the measured Sharp/libvips affine reference; Canvas and Squoosh's triangle resizer do not.                |
| Cache           | Use only current `static-${VERSION}` and existing `dynamic`; lazy-cache exact current-build worker/runtime/model/decoder assets after a complete canonical HTTP 200 response.                               | This preserves Squoosh's update lifecycle and avoids a new readiness/cache protocol.                                    |
| Export          | Display the processed image normally and recommend OxiPNG or Browser PNG for transparency.                                                                                                                  | Identity export downloads the original file; JPEG has no alpha.                                                         |
| Recovery        | Treat device/session loss as terminal for that generated worker, terminate/reset the existing bridge after the settled error, and retry in a fresh ordinary worker.                                         | Session state is worker-local; a fresh generated worker is the smallest reliable reset boundary.                        |
| Release         | Require supported-hardware browser evidence, a real Netlify preview, and a documented model-provenance/redistribution decision.                                                                             | These are product/release decisions, not facts that can be inferred from local code.                                    |

## 3. Model artifact and graph contract

### 3.1 Immutable artifact

- Repository: <https://huggingface.co/onnx-community/BEN2-ONNX>
- Immutable revision:
  <https://huggingface.co/onnx-community/BEN2-ONNX/tree/c552aa82688edce09f0ac9d2e31ad53d9d629010>
- File: `onnx/model_fp16.onnx`
- Immutable download URL:
  <https://huggingface.co/onnx-community/BEN2-ONNX/resolve/c552aa82688edce09f0ac9d2e31ad53d9d629010/onnx/model_fp16.onnx>
- Size: **219,121,675 bytes** (208.971 MiB)
- SHA-256:
  `dfdc25f421f32a0d1268e0f2ff2153d340e8f1d52d3dd16f5dc33c1ce85cedf1`

The response metadata reported the same commit, size, and digest. The historical
Git LFS pointer also names the same digest and size.

### 3.2 Parsed ONNX graph

| Property                 | Value                                         |
| ------------------------ | --------------------------------------------- |
| IR version               | 8                                             |
| Producer                 | PyTorch 2.5.1                                 |
| Opsets                   | `ai.onnx` 15; `com.microsoft` 1               |
| Input                    | `pixel_values`, float32, `[1, 3, 1024, 1024]` |
| Output                   | `alphas`, float32, `[1, 1, 1024, 1024]`       |
| Nodes                    | 2,651                                         |
| Microsoft contrib nodes  | 24 `MultiHeadAttention`                       |
| Initializers             | 722, all embedded `raw_data`                  |
| External data            | none                                          |
| Stored initializer bytes | 218,380,614                                   |

The artifact is self-contained. There is no external weight shard to host or
cache. ONNX checking and strict shape inference pass without rewriting the
file.

The graph has no user-adjustable threshold, quality, resolution, refinement, or
batch input. The only product control is whether background removal is enabled.

### 3.3 Provenance and licensing facts

Relevant sources:

- Official BEN2 repository: <https://github.com/PramaLLC/BEN2>
- Immutable official BEN2 MIT license:
  <https://github.com/PramaLLC/BEN2/blob/2c99a5da477b5523585bfa5c893888a6e818a8f6/LICENSE>
- Official weights: <https://huggingface.co/PramaLLC/BEN2>
- Candidate conversion:
  <https://huggingface.co/onnx-community/BEN2-ONNX/tree/c552aa82688edce09f0ac9d2e31ad53d9d629010>
- DIS repository: <https://github.com/xuebinqin/DIS>
- DIS project page and DIS5K information: <https://xuebinqin.github.io/dis/index.html>

The official source contains an MIT license. The official and converted model
cards declare MIT. The graph itself has no embedded license metadata.

The BEN2 README says the model was trained on DIS5K and a proprietary Prama LLC
22K segmentation dataset. DIS separates its Apache-2.0 code license from its
dataset terms. The captured DIS5K terms reserve rights, permit non-commercial
research/education, require permission for commercial use, and restrict
redistribution of the database as-is or processed. The proprietary 22K set is
not described sufficiently to assess composition or rights. The conversion
repository does not provide a reproducible conversion script, source-weight
hash, or signed relicensing statement.

This document does not give legal advice. Before production distribution, the
project owner must record a decision for this exact model hash covering:

- build-time acquisition and CI handling;
- public same-origin redistribution;
- general/commercial downstream use;
- whether dataset restrictions affect the trained weights;
- whether the conversion's provenance is sufficient;
- required BEN2, ONNX Runtime, Transformers.js-reference, and other notices.

That is a release gate. It is not a claim that project or Netlify access is
missing.

## 4. Authoritative pixel contract

### 4.1 Decode and source-alpha behavior

The model sees RGB only. Source alpha is not multiplied into RGB and does not
enter the graph. We retain the original straight RGB for final composition and
replace the alpha channel with the generated matte.

This distinction matters for transparent PNGs. The browser path
`createImageBitmap -> drawImage -> getImageData` produces composited/premultiplied
results and destroys RGB values hidden under alpha. In the measured RGBA
fixture, pixels with source alpha zero had decoded RGB MAE 125.735668 u8. Setting
the returned alpha bytes to 255 does not recover those values.

For a BEN2-enabled PNG, the intended flow is therefore:

```text
encoded File/Blob
  -> existing WorkerBridge
  -> normal generated features worker
  -> existing codecs/png decoder
  -> straight RGBA ImageData
  -> BEN2 preprocessing
```

The branch contains a thin
`src/features/decoders/png/worker/pngDecode.ts` wrapper for this purpose. It is
not a new worker; feature discovery adds it to the existing generated worker.

JPEG has no hidden-alpha issue, but exact browser-vs-Sharp color/decode parity is
not proven. Existing direct worker decoders are candidates for WebP, AVIF, JXL,
QOI, and WP2, but each needs codec-specific parity fixtures. GIF, SVG, and other
browser-only transparent formats need either a direct decoder or separately
approved browser-contract goldens. We must not silently claim Sharp parity for
formats that still use browser rasterization.

### 4.2 Input resize and normalization

The reference is the Node path of `@huggingface/transformers@4.2.0` at source
revision `54652ba3366ccd1e3b64e689a96504309e6fb53b`. That path uses Sharp
0.34.5/libvips affine bilinear sampling, not browser Canvas resizing.

For each destination coordinate:

```text
sx = destinationX * sourceWidth  / destinationWidth
sy = destinationY * sourceHeight / destinationHeight
x0 = floor(sx), x1 = x0 + 1, fx = sx - x0
y0 = floor(sy), y1 = y0 + 1, fy = sy - y0
```

Sample the four neighbors bilinearly. A neighbor outside the source contributes
zero. Round the interpolated byte and clamp to `[0, 255]`. The branch's
`resizeU8AsymmetricZero` implementation makes the geometry and edge behavior
explicit. Do not substitute Canvas or `codecs/resize` triangle filtering.

The full model input pipeline is:

1. Decode straight source RGB and retain original RGB for output.
2. Ignore source alpha for inference.
3. Distort to exactly 1024×1024. Do not preserve aspect ratio or letterbox.
4. Convert each RGB byte to `[0, 1]` with `/ 255`.
5. Normalize with means `[0.485, 0.456, 0.406]` and standard deviations
   `[0.229, 0.224, 0.225]`.
6. Pack contiguous float32 NCHW `[1, 3, 1024, 1024]` under the input name
   `pixel_values`.

### 4.3 Output and matte resize

The observed graph output is already sigmoid-like, with only epsilon-scale
excursions around 0 and 1. Match the candidate reference:

1. Inspect the full output. Apply sigmoid only if any value is below `-1e-5` or
   above `1.00001`.
2. Do **not** min-max normalize.
3. Multiply by 255, clamp to `[0, 255]`, and truncate/cast to uint8 **before**
   resizing.
4. Resize the 1024×1024 one-channel matte to the source dimensions with the same
   asymmetric, zero-border bilinear geometry. Round resized samples to u8.
5. Copy the original straight RGB bytes exactly and replace/add alpha from the
   resized matte. Do not multiply by the source alpha.

### 4.4 Model-free parity evidence

The portable preprocessing correction on this branch was independently reviewed
without model inference.

| Fixture      |         Input tensor MAE |              Input max |             Matte MAE u8 | Matte max |  IoU at alpha >= 128 |
| ------------ | -----------------------: | ---------------------: | -----------------------: | --------: | -------------------: |
| RGB 640×360  |   `4.466890265083142e-8` | `2.384185791015625e-7` | `0.00016059027777777778` |         1 | `0.9999831243566161` |
| RGBA 333×517 | `0.00005186504890541954` |  `0.01750713586807251` |  `0.0002788087894470873` |         1 |                  1.0 |

For the transparent fixture, RGB components at alpha zero hash to
`d30137f7c3e11ad45b459dff4c3438519bf9fae9cf86d3cc9b958d938eefc5df`,
matching the authoritative source.

The earlier Canvas implementation produced final alpha MAE 2.681577, maximum
error 239, and IoU 0.984337592. That failure was a real preprocessing contract
bug, not evidence that the release threshold should be relaxed.

## 5. Application architecture

### 5.1 End-to-end flow

```text
Source File/Blob
  |
  v
Compress/query-gated client state
  |
  | existing WorkerBridge and AbortSignal
  v
Generated features worker
  |
  +--> optional encoded PNG decode in existing PNG codec
  |
  +--> deterministic BEN2 preprocessing
  |
  +--> module-level ORT session promise
  |      |
  |      +--> same-origin asyncify MJS/WASM
  |      +--> same-origin 219 MB ONNX
  |
  +--> deterministic matte postprocessing
  |
  v
Original-size ImageData (original RGB + replacement alpha)
  |
  v
Normal Squoosh preview and encoder/export pipeline
```

The BEN2 function is an ordinary discovered worker feature. Shared preprocessing
receives a `WorkerBridge` parameter and invokes `workerBridge.ben2(...)`. BEN2
must not reference a global bridge array, assume bridge index zero, or construct
its own worker.

### 5.2 Session and idle lifetime

- Keep a module-level lazy `sessionPromise` in the generated worker.
- Concurrent/serial calls in the same worker share that promise.
- Keep Squoosh's existing 10-second worker timeout. It is an **idle** timeout,
  not a call deadline: the bridge clears it before a call and schedules it in
  `.finally()` after the call settles.
- A measured 13-minute busy call remained alive, confirming that existing
  behavior.
- Immediate reuse should use the same worker and one session.
- After more than 10 seconds idle, the next call should create a new ordinary
  worker and one new session.

### 5.3 Cancellation and stale output

The existing bridge cancellation path is the design:

1. Source/settings replacement aborts the old main operation.
2. The bridge's abort listener terminates the active generated worker.
3. The awaiting call rejects with `AbortError`.
4. Publication remains guarded by the current signal.
5. A later request creates a distinct generated worker.
6. No output from the old source may publish after replacement.

A direct Chromium cancellation spike confirmed that normal UI Back/unmount
aborted source A through the existing `AbortSignal` listener and destroyed the
first worker target. Uploading source B then created a distinct worker. Source A
rejected with `AbortError`, and no stale A result appeared during a further
12-second observation.

### 5.4 Terminal session/device recovery

Cancellation is not the same as terminal WebGPU/session failure. The production
design should:

- clear the worker-local `sessionPromise` when session creation fails;
- observe `device.lost` and mark the worker-local BEN2 state terminal;
- reject the current or next BEN2 call with a small transport-safe distinguished
  error, identified by `name` rather than cross-realm `instanceof`;
- catch that settled non-abort error in client-owned shared preprocessing;
- invoke a minimal generic `WorkerBridge.terminate()` only after no call remains
  active;
- show a retryable UI error;
- let user retry create a new normal generated worker and session.

The worker must not reach into client bridge state. Do not add another bridge or
special BEN2 worker.

## 6. ONNX Runtime Web integration

### 6.1 Package and assets

Pin exact `onnxruntime-web@1.27.0`.

Use:

```ts
import * as ort from 'onnxruntime-web/webgpu';
import wasmLoaderUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs';
import wasmUrl from 'url:onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm';
```

The nested client/worker resolver must include the
`onnxruntime-web-use-extern-wasm` export condition. The matching stock artifacts
are:

| Asset                                  |      Bytes | SHA-256                                                            |
| -------------------------------------- | ---------: | ------------------------------------------------------------------ |
| `ort-wasm-simd-threaded.asyncify.mjs`  |     47,507 | `7236653b8565da4046e459cd0e274123419a1d9f1f8f18fd36c28058346ca655` |
| `ort-wasm-simd-threaded.asyncify.wasm` | 24,254,953 | `7e83cd6cee77e478bc96a7e91b198144fb5e4126287daf1f9b54bb195ebcd55a` |

Configure before session creation:

```ts
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = {
  mjs: new URL(wasmLoaderUrl, location.href).href,
  wasm: new URL(wasmUrl, location.href).href,
};
```

The intended production session uses:

```ts
{
  executionProviders: ['webgpu'],
  graphOptimizationLevel: 'disabled',
}
```

The branch is deliberately a diagnostic spike and currently contains verbose
logging plus `executionProviders: ['webgpu', 'wasm']`. Those are not final
product decisions. Production removes verbose adapter/shader diagnostics and
the WASM provider.

The `/webgpu` external entry selects the asyncify WebGPU initialization path.
Pairing it with JSEP assets or importing the package root produced an invalid or
unnecessary asset/loader path and was rejected.

### 6.2 Generated classic worker and `.mjs`

The generated root features worker remains a classic worker. ORT's external
loader is an ES module. `lib/omt.ejs` therefore resolves the URI and uses native
`import()` for `.mjs` before the legacy AMD/`importScripts()` `.js` route. This
prevents `.mjs.js` and classic-script loading failures without changing all
other generated worker dependencies.

### 6.3 Capability gate

The UI probe should be cheap and must run before starting any BEN2 download:

```ts
if (!self.isSecureContext || !navigator.gpu) return unsupported;
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: 'high-performance',
  forceFallbackAdapter: false,
});
if (!adapter || !adapter.features.has('shader-f16')) return unsupported;
const device = await adapter.requestDevice({
  requiredFeatures: ['shader-f16'],
});
device.destroy();
```

The worker repeats the authoritative adapter/feature/device check before session
creation. Product support must additionally exclude known fallback/software
adapters according to measured adapter information; browser names alone are not
enough.

If unsupported, disable the operation and explain why. Do not fetch the model
and do not silently run a multi-minute WASM attempt.

## 7. Build-time acquisition and bundling

The branch contains `lib/prepare-ben2-model.js`. Its required behavior is:

1. Use only the immutable HTTPS URL from section 3.
2. Follow a small bounded number of HTTPS redirects.
3. Reuse an existing local file only after checking exact size and SHA-256.
4. Download to a PID/timestamp-qualified temporary file. The current spike
   assumes one model-preparation call per build; production should either retain
   that serialization or add a random/collision-safe suffix.
5. Stream bytes and hash; abort if size exceeds the expected value.
6. Require exact final byte count and digest.
7. Close the file and atomically rename to `.tmp/ben2/model_fp16.onnx`.
8. Remove the temporary/canonical bad file on error.
9. Fail the build closed; never substitute another revision.

`ben2.ts` imports the verified local file through Rollup's URL loader. The real
build emits a content-hashed same-origin ONNX path together with the generated
worker and ORT MJS/WASM. Runtime JS contains no model ID or remote resolver.

The 219 MB file exceeds GitHub's ordinary 100 MB object limit and must not be
committed. We are not assuming Git LFS or Netlify Large Media as an alternative.
Netlify documents Large Media as intended for files up to 100 MB.

A clean branch build has already proven:

- the model downloader obtains and verifies the exact artifact;
- a second invocation is a verified no-op;
- the emitted ONNX has the exact source size and hash;
- emitted stock ORT assets have the expected hashes;
- executable output contains no runtime Hugging Face/CDN source URL;
- no tracked blob exceeds 100 MB.

## 8. Persistent cache and offline behavior

### 8.1 One existing cache lifecycle

Use the current Squoosh caches only:

- `static-${VERSION}`
- existing `dynamic`

Do not introduce a BEN2 cache. Existing service-worker activation already deletes
old static versions, so BEN2 assets naturally invalidate with an app version.

The generated worker may follow normal Squoosh lazy caching. The large/derived
BEN2 assets must be excluded from editor-wide prefetch and cached on first
successful BEN2 use:

- generated features worker;
- exact asyncify MJS;
- exact asyncify WASM;
- exact ONNX;
- dynamic PNG decoder JS and PNG decoder WASM needed by the source-byte path.

The PNG decoder assets are a known current gap: the model/ORT cache contract was
proven, but the later attempt to add explicit lazy decoder caching was rolled
back. Do not claim post-idle offline transparent-PNG support until those decoder
assets are derived and tested as exact current-build entries.

### 8.2 Cache eligibility

An asset may be written only when all are true:

- request method is GET;
- URL origin is the current app origin;
- pathname exactly matches a derived current-build asset;
- no URL query;
- no `Range` request header;
- fetch succeeds;
- response is non-opaque;
- response status is exactly 200;
- the complete cloned body is consumed by Cache Storage.

A query variant, 206, non-200 response, abort, partial body, opaque response, or
fetch failure must not create or replace an entry. A later Range request must
retain normal network/206 semantics and must not consume or corrupt the complete
cached object.

Use the named current static cache for reads and writes; do not let
`caches.match()` accidentally satisfy current status from an unrelated stale
cache.

### 8.3 Existing cache evidence

A direct Chromium cache spike passed 14 cases for worker/model/ORT assets:

- initial/status/editor load did not fetch or create model/MJS/WASM entries;
- Range-before-full, exact 206, 503, aborted body, and query variants left no
  model entry;
- an unrelated stale cache did not satisfy current status;
- a complete 200 cached the exact 219,121,675-byte model with the expected hash;
- exact MJS/WASM entries had package hashes;
- status was read-only;
- a later Range stayed 206 and left the full cached model intact;
- cache names remained current static and dynamic only.

### 8.4 Cache status semantics

The client should ask the service worker for a controlled list of derived asset
statuses. It must not submit arbitrary URLs. The status lookup must first inspect
`caches.keys()` and must not open/create the static cache just to report status.

Suggested states:

- **Checking cache…**
- **Cache status unavailable until this page is controlled by the service
  worker.**
- **Not cached for this app version.**
- **Partially cached for this app version (N of M files). Reconnect to finish.**
- **Cached for this app version.**

“Cached” means exact files exist now; it is not a promise against browser
storage eviction, a statement that the current document is retained, or proof
that inference has ever completed.

### 8.5 Required offline proof

The future acceptance runner must:

1. Start in a fresh profile/cache.
2. Complete one online inference and verify exact cache entries/hashes.
3. Complete an immediate second run from the same worker/session.
4. Wait more than 10 seconds and prove the old worker is destroyed.
5. Stop the HTTP server and prove the port is closed.
6. Trigger a new PNG run from the still-open app.
7. Observe a distinct generated worker and new ORT session.
8. Serve worker, decoder JS/WASM, ORT MJS/WASM, and ONNX from current static
   cache with no external request.
9. Complete output and parity checks.

Keeping the old session alive is not offline-session-recreation evidence.

## 9. UI and export integration

The final feature should be a single shared operation/panel, not duplicated in
both encoder settings. Working name: **Remove background (BEN2)** or **AI
Background Removal**.

Expose only an enable toggle and state:

- capability checking/unsupported reason;
- first-use size warning;
- current cache state;
- processing/error/retry state;
- transparency/export guidance.

Suggested copy:

- **First use downloads a 219,121,675-byte (208.971 MiB) model, plus runtime
  files.**
- **Processing stays on this device. Browser storage eviction or an app update
  may require another download.**
- **Unavailable: BEN2 requires WebGPU with shader-f16 on this device.**
- **BEN2 creates transparency. “Original Image” downloads the original file,
  not this result, and JPEG cannot preserve alpha. Choose OxiPNG or Browser PNG
  to export the transparent result.**

When disabled, preprocessing must be an identity with no model/runtime request.
On a recoverable error, preserve the last completed image rather than publishing
partial/stale output.

Output acceptance:

- exact original dimensions;
- exact original RGB for every pixel;
- source alpha replaced, not multiplied;
- alpha MAE <= 0.25 u8;
- maximum alpha error <= 24 u8;
- IoU at alpha >= 128 >= 0.998;
- decoded PNG dimensions/RGB/alpha match the displayed processed `ImageData`.

Do not relax these thresholds to accept the failed Canvas path.

## 10. Current branch state versus target design

The branch is intentionally a spike and currently consists of two commits before
this document:

1. `e54df4c524bd9b472712b896940d1027128fe7be` — reproducible model acquisition,
   ORT/build/worker/cache/query-gated spike.
2. `fd4f638f5dbc591080f6805c4df088ec409d8c6b` — portable PNG decode and
   deterministic preprocessing/matte parity correction.

### Present and useful in the branch

- pinned build-time model acquisition;
- exact ORT package and external asyncify assets;
- `.mjs` generated-worker loader repair;
- normal feature-worker discovery and WorkerBridge exposure;
- module-level session promise;
- query-gated BEN2 invocation;
- deterministic preprocessing/postprocessing helpers;
- PNG encoded-byte decoder route;
- strict model/ORT first-use cache helper;
- read-only-ish cache-status bridge pattern;
- cancellation audit instrumentation.

### Deliberately disposable or incomplete

- query-string activation (`?ben2`);
- verbose console/adapter/session diagnostics;
- `window.__squooshBen2*` audit globals;
- `executionProviders: ['webgpu', 'wasm']` rather than product WebGPU-only;
- no complete product capability gate;
- no final UI panel/copy;
- no committed acceptance fixtures/runner;
- cache status currently accepts client URL data rather than owning its exact
  controlled inventory;
- PNG decoder dynamic assets are not yet proven in the lazy offline cache path;
- no generic terminal bridge recovery;
- no corrected physical-GPU output has passed;
- no deployed preview has tested the 219 MB asset.

No machine-specific ORT batching/wait patch, Mesa patch, or PanVK workaround is
present after rollback. Stock `onnxruntime-web@1.27.0` assets are restored.

## 11. Browser and GPU evidence

### 11.1 What happened on the local machine

The local machine has a physical Mali-G610 MC4 using panthor/PanVK.

Stock Mesa 26.1.4 reported Vulkan `maxImageDimension3D=512`. WebGPU requires at
least 2048, so Dawn rejected the physical Vulkan adapter. Headless and Xvfb used
SwiftShader without `shader-f16`; Wayland WebGL used Mali but WebGPU still fell
back. Forcing Vulkan returned no adapter.

A temporary Mesa build containing upstream commit
`f3d3102143a84af85b6dbd9fd4c9d43dd1425840` removed the artificial PanVK limit.
That made Chromium expose a non-fallback ARM Valhall adapter with `shader-f16`.
This proved the hardware and browser could reach real WebGPU, but it did not
make the stack product-supported.

On that temporary stack:

- stock queued ORT execution reached real BEN2 shader dispatch and lost the
  device;
- Linux panthor logged a five-second GPU-job timeout in one diagnostic run;
- changing ORT to one dispatch per command buffer did not prevent loss;
- allowing at most two in-flight submissions still lost the device;
- a diagnostic ORT build that waited for completion after **every** submission
  completed once.

The fully serialized diagnostic completed 2,721/2,721 submissions:

- session creation: 11.287 s;
- inference: 279.136 s (4m39.136s);
- peak aggregate Chromium RSS: 2,154.52 MiB;
- residual RSS: about 1.28 GiB after 120 seconds.

It used modified ORT scheduling and is not a product benchmark or acceptable
production workaround. W1/W2 custom assets and source patches were rolled back.
The local result should be recorded as **unsupported Mali/PanVK behavior**, not
as evidence that WebGPU generally cannot run BEN2.

### 11.2 What the next-machine test must establish

Start with an unmodified browser, stock ORT 1.27 assets, and no unsafe/software
adapter flags. Record:

- OS/version;
- browser exact version/channel;
- CPU and installed RAM;
- GPU, driver, power mode;
- adapter vendor/architecture/description;
- fallback status when exposed;
- adapter features and relevant limits;
- successful required-feature device creation.

Only then run the matrix in section 13. Do not carry any local Mesa or ORT
workaround to the next machine.

## 12. Performance and memory policy

Existing native ARM64 CPU reference runs took about 31–35 seconds. Their process
peaks ranged from roughly 3.23 GiB to 5.36 GiB for native ORT, while the
Transformers/Node process eventually reached about 10.93 GiB. Browser WASM
attempts did not complete within bounded multi-minute runs. The serialized
Mali/PanVK diagnostic took 279 seconds and about 2.15 GiB browser RSS.

These measurements come from different runtimes/stages and are not directly
comparable. They do not define a product budget.

On representative supported hardware, measure:

- cold model/runtime download;
- cold session creation;
- cold inference;
- immediate warm inference;
- post-idle worker/session recreation;
- server-stopped offline recreation;
- peak aggregate browser RSS;
- renderer/GPU process memory where available;
- residual memory at +60 and +120 seconds;
- crash, OOM, timeout, device-loss, and recovery events.

Correctness has fixed thresholds. Latency/memory support thresholds require an
explicit product decision after representative data exists. A crash, OOM, or
unrecovered device loss is a technical failure regardless of latency policy.

## 13. Remaining spike plan

No more GPU work should run on the known unsupported local Mali/PanVK stack. Run
these on a different, physically supported WebGPU machine.

### Spike A — stock capability and build inventory

1. Check out this branch with no diagnostic driver/runtime modifications.
2. `npm ci`.
3. Remove `.tmp/ben2` and `build`.
4. Run the pinned model preparation/build.
5. Verify emitted ONNX/MJS/WASM/worker hashes and no runtime remote URLs.
6. Launch stable Chrome/Chromium with a fresh profile and normal hardware
   acceleration.
7. Record adapter/device evidence and require `shader-f16`.

Pass: physical non-fallback adapter, required device succeeds, exact stock assets
are served.

### Spike B — cold corrected RGB

Upload the exact 640×360 RGB fixture through normal UI/query-gated flow. Record
all model/runtime requests, worker ID, session/run counters, timings, RSS, output
arrays, and exported PNG.

Pass: completed inference, exact dimensions/RGB, alpha thresholds, lossless PNG,
no device loss/OOM.

### Spike C — immediate RGBA reuse

Immediately upload the exact 333×517 transparent PNG. Prove the encoded Blob went
through the existing worker PNG decoder and preserved hidden RGB. Prove same
worker/session and incremented run count.

Pass: same worker/session, no repeated immutable-asset network bytes, corrected
RGBA output and PNG thresholds.

### Spike D — idle recreation

Wait at least 12 seconds after completion. Prove the old worker target was
destroyed. Upload again and require a distinct worker with one session creation
and one run.

### Spike E — server-stopped offline recreation

After a successful online run and idle destruction:

1. inventory and hash current static-cache entries;
2. stop the HTTP server and prove the port is closed;
3. trigger a new transparent-PNG run from the open app;
4. prove new worker/session identity;
5. prove worker, PNG decoder JS/WASM, ORT MJS/WASM, and model came from the
   existing cache;
6. prove no third-party request;
7. complete output/export parity.

This spike will require implementing the missing exact lazy PNG-decoder cache
inventory first.

### Spike F — cancellation and stale publication

Start a real inference, replace the source through normal UI, and require:

- old worker destroyed by existing AbortSignal listener;
- old call rejects `AbortError`;
- new source uses a distinct worker;
- no stale old output after a further observation window.

### Spike G — terminal recovery

Using acceptance-only instrumentation that is absent from production, inject a
session-creation failure and post-success device loss through the production
preprocessing path. Prove terminal error -> settled client bridge reset ->
distinct worker -> user retry -> exactly one new session/run. The harness must
not directly call a terminate hook and claim success.

### Spike H — staging/Netlify

After authenticated push and PR creation, verify the real deploy preview:

- Netlify check and deploy URL;
- full GET/HEAD where supported;
- first, middle, and final byte ranges;
- exact model length/hash;
- `.mjs`, `.wasm`, `.onnx` MIME types;
- COOP/COEP and service-worker root scope;
- upload duration and actual published build size;
- fresh-profile first-use cache, server/network-offline behavior, and version
  update;
- account/plan bandwidth and retention decision.

Do not infer 219 MB static-asset support from the existing production site's
small JS/WASM behavior.

## 14. Acceptance harness and fixtures

Before production implementation, commit a deterministic acceptance harness
under `test/ben2/`. It should use an already-launched Chromium DevTools endpoint
and produce schema-validated JSON. Acceptance hooks must exist only in an
`BEN2_ACCEPTANCE=1` build and be absent/tree-shaken from production.

Required fixtures (procedural, no external source material, CC0-1.0):

| File                          |  Bytes | SHA-256                                                            |
| ----------------------------- | -----: | ------------------------------------------------------------------ |
| `procedural-rgb-640x360.png`  | 26,961 | `7c78065fb770c7f67abb2478f9384dd978ba5b39b3ae53c8409889f994cdf8f6` |
| `procedural-rgba-333x517.png` | 12,481 | `743c84d695ff22c48fde384c4f1e79f1e6a784b0fad5b34a9faa1789529b9ba1` |

Required authoritative Transformers.js 4.2.0 goldens:

| File                                            | SHA-256                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `procedural-rgb-640x360-transformers-alpha.u8`  | `18c93393fc7be8752f1187f3be7527e86cb27a8f6a5df2c68ab3563a91d31ab0` |
| `procedural-rgb-640x360-transformers-rgba.png`  | `3856a29e3bafaf24d8e56a1bab9e1734be0701210af924dd4fefa78a44138bff` |
| `procedural-rgba-333x517-transformers-alpha.u8` | `fdc69c8ad3a1b76b9a8b2ebd6ee4f0b4c4e56ed08aa3dee0b16b1786c392eb66` |
| `procedural-rgba-333x517-transformers-rgba.png` | `643631d930313fbc58e0b77ced579e7523d1838742f60193b326ce2e6be85468` |

The runner must hash these six named files before browser work; no wildcard
selection. Its result schema must include:

- build/asset hashes;
- browser/OS/adapter/device metadata;
- each worker identity;
- session creation and run counters;
- request records;
- exact current-cache inventory;
- fixture/golden hashes;
- output dimensions;
- source-RGB equality;
- alpha MAE/max/IoU;
- displayed RGBA and decoded PNG comparison;
- cancellation/stale-result assertions;
- terminal-recovery assertions;
- timings and memory samples;
- errors and final `passed`.

`passed: true` must be impossible if a required subcheck is absent or skipped.
An unsupported adapter is a blocked/failing environment, not a skipped success.

Testing layers:

1. artifact/hash/graph manifest;
2. build helper failure cases and valid reuse;
3. model-free resize/normalization/matte unit tests, including 1×1, 1×N, N×1,
   equal-size, trailing zero-border, and invalid dimensions;
4. transparent PNG hidden-RGB decode test;
5. build inventory and runtime-URL scan;
6. service-worker full/range/query/error/abort/status/update tests, including
   PNG decoder assets;
7. bridge cancellation/idle/session/recovery tests;
8. physical browser output/export/offline/performance/memory matrix.

## 15. Implementation plan after spikes

### Phase 0 — owner/provenance decision

Record whether the exact artifact may be acquired in CI and redistributed by
Squoosh, and record required notices. Stop release work if rejected.

### Phase 1 — tests and artifact lock

- Add `test/ben2` fixtures, goldens, schema, and runner first.
- Add/finish acquisition-helper tests for valid reuse, redirect, HTTP error,
  truncation, oversized stream, wrong hash, abort, and atomic cleanup.
- Lock model and ORT versions/hashes.

Rollback point: no application invocation yet.

### Phase 2 — deterministic pixel contract

- Keep the reviewed shared preprocessing helper.
- Keep encoded-PNG worker decode.
- Add direct-decoder parity per supported transparent format or explicitly
  limit the authoritative contract.
- Add unit tests for resize/numeric edge cases.

Rollback point: feature still disabled/query-gated.

### Phase 3 — production worker/session path

- Replace verbose spike diagnostics with capability/error types.
- Make execution provider WebGPU-only.
- Add worker-local terminal state and safe session reset.
- Add minimal generic settled-call bridge termination if tests demonstrate it
  is needed.
- Keep one generated worker architecture and existing idle semantics.

### Phase 4 — exact lazy cache

- Derive and assert exact worker/model/ORT/decoder assets from build entry data.
- Exclude only intended lazy dependencies from broad editor prefetch.
- Implement strict named-current-cache fetch policy.
- Make status own its URL inventory and remain read-only.
- Complete no-inference cache matrix before GPU acceptance.

### Phase 5 — shared UI/export

- Add one shared background-removal panel.
- Add capability gate before download.
- Add first-use and cache copy.
- Add PNG guidance and identity/JPEG warnings.
- Preserve previous output on error and provide retry.

### Phase 6 — physical acceptance

Run every spike in section 13 with the named runner. Do not merge based on a
manual visual check or one successful inference.

### Phase 7 — authenticated staging

Push/open a PR, let Netlify create a deploy preview, and run the large-asset,
headers/range, service-worker, offline, and bandwidth matrix.

### Phase 8 — product decision and cleanup

- Decide supported hardware/browser/OS scope from evidence.
- Decide acceptable cold/warm latency and peak/residual memory.
- Remove all `?ben2`, console timing, audit globals, and verbose logs.
- Confirm acceptance instrumentation is absent from production output.
- Attach provenance decision and notices.

## 16. File-level integration map

### Already present on this spike branch

- `.gitignore`
- `lib/prepare-ben2-model.js`
- `lib/omt.ejs`
- `package.json`, `package-lock.json`
- `rollup.config.js`
- `src/features/preprocessors/ben2/shared/meta.ts`
- `src/features/preprocessors/ben2/shared/preprocessing.ts`
- `src/features/preprocessors/ben2/worker/ben2.ts`
- `src/features/preprocessors/ben2/worker/missing-types.d.ts`
- `src/features/decoders/png/worker/pngDecode.ts`
- `src/client/lazy-app/Compress/index.tsx`
- `src/client/lazy-app/worker-bridge/index.ts`
- `src/client/lazy-app/sw-bridge/index.ts`
- `src/sw/index.ts`, `src/sw/to-cache.ts`, `src/sw/util.ts`
- query-gated cancellation/audit file

### Planned production additions/changes

- shared production UI component and styling for one BEN2 panel;
- controlled capability/result/error/cache-status types;
- generic settled-call terminal bridge recovery, if validated;
- exact PNG decoder JS/WASM lazy-cache derivation;
- acceptance fixtures, goldens, runner, schema, and build flag;
- explicit static-host MIME/header rules if staging proves defaults insufficient;
- production notices/attribution required by the owner decision.

Generated feature metadata/bridge sources and `build/**` must be inspected after
build but never hand-edited or committed.

## 17. Rejected alternatives

- **Separate BEN2 worker/bridge:** duplicates and bypasses working generated
  infrastructure.
- **Always use bridge zero:** shared preprocessing already receives a bridge;
  indexing is an unnecessary coupling.
- **Runtime HF fetch:** breaks deterministic build, same-origin policy, cache
  control, deployment review, and offline behavior.
- **Commit/Git LFS model:** ordinary Git rejects the file; LFS introduces
  unapproved storage/deploy behavior and does not solve runtime distribution.
- **Separate BEN2 cache:** existing versioned static lifecycle already provides
  correct update invalidation.
- **Eager install/editor model cache:** makes opening Squoosh download hundreds
  of MB before feature intent/support is known.
- **`cache.addAll` as readiness:** creates a 243+ MB all-or-nothing protocol;
  ordinary exact immutable fetches are simpler and observable.
- **Canvas preprocessing:** destroys transparent RGB and misses reference resize
  geometry.
- **Existing triangle resize WASM:** measured tensor/matte parity misses the
  reference contract.
- **Min-max matte normalization:** not used by the pinned candidate pipeline.
- **Expose official wrapper options:** refinement/threshold/video controls are
  wrapper behavior, not graph inputs.
- **JSEP/root ORT asset combination:** wrong external initialization/ABI path
  for the chosen WebGPU entry.
- **Silent WASM fallback:** bounded attempts did not complete practically.
- **Ship serialized ORT waits or patched PanVK:** diagnostics altered runtime
  scheduling/driver behavior and were rolled back.
- **Relax parity thresholds:** would conceal the identified Canvas bug.
- **Silently select PNG:** violates user encoder intent; guidance is enough.

## 18. Deployment plan

A PR whose base is `dev` has historically received a Netlify status named
`deploy/netlify` and a preview at
`https://deploy-preview-<PR-number>--squoosh.netlify.app`. Both same-repository
and fork PRs have produced previews.

The branch is designed to build from a clean checkout without committing the
model. The first build will download and verify approximately 219 MB before
emitting an approximately 269 MB site. The actual final inventory must be
measured; do not reuse a stale total after asset changes.

Preview validation must capture:

- deploy ID/URL, command/tool version, elapsed time, uploaded bytes;
- exact generated asset list and hashes;
- ONNX full length and SHA-256;
- first/middle/final range 206 behavior;
- JavaScript MIME for `.js` and `.mjs`;
- `application/wasm` for `.wasm`;
- non-HTML binary MIME for `.onnx`;
- COOP `same-origin` and COEP `require-corp`;
- service-worker scope and update lifecycle;
- first-use cache and server/network-stopped behavior;
- account plan/bandwidth/retention/overage acceptance.

No deploy preview has yet tested this 219 MB object. The local branch was not
pushed during the original spikes because the shell had no authenticated GitHub
identity at that time.

## 19. External references

### BEN2 and model

- BEN2 source: <https://github.com/PramaLLC/BEN2>
- BEN2 immutable MIT license:
  <https://github.com/PramaLLC/BEN2/blob/2c99a5da477b5523585bfa5c893888a6e818a8f6/LICENSE>
- Official BEN2 weights: <https://huggingface.co/PramaLLC/BEN2>
- Candidate repository: <https://huggingface.co/onnx-community/BEN2-ONNX>
- Candidate immutable tree:
  <https://huggingface.co/onnx-community/BEN2-ONNX/tree/c552aa82688edce09f0ac9d2e31ad53d9d629010>
- Candidate immutable ONNX:
  <https://huggingface.co/onnx-community/BEN2-ONNX/resolve/c552aa82688edce09f0ac9d2e31ad53d9d629010/onnx/model_fp16.onnx>

### Training data/provenance

- DIS source: <https://github.com/xuebinqin/DIS>
- DIS project/DIS5K: <https://xuebinqin.github.io/dis/index.html>
- DIS paper: <https://arxiv.org/abs/2203.03041>

### Runtime and browser platform

- ONNX Runtime Web WebGPU guide:
  <https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html>
- ONNX Runtime source: <https://github.com/microsoft/onnxruntime>
- Transformers.js source: <https://github.com/huggingface/transformers.js>
- WebGPU specification, `shader-f16`:
  <https://www.w3.org/TR/webgpu/#shader-f16>
- Chrome WebGPU overview:
  <https://developer.chrome.com/docs/web-platform/webgpu/overview>
- WebGPU major-browser status:
  <https://web.dev/blog/webgpu-supported-major-browsers>
- GPUWeb implementation status:
  <https://github.com/gpuweb/gpuweb/wiki/Implementation-Status>

### Hosting

- Netlify deploy documentation: <https://docs.netlify.com/deploy/>
- Netlify Large Media limitations:
  <https://docs.netlify.com/build/git-workflows/large-media/requirements-and-limitations/>
- Netlify accounts/billing:
  <https://docs.netlify.com/manage/accounts-and-billing/>
- Current production site: <https://squoosh.app/>

## 20. Local reproducibility evidence

These paths are ephemeral local spike records, not files expected to ship in
Git. They are listed so this branch's decisions can be audited while the
workspace is available.

- Artifact, graph, license facts, fixtures, native references:
  `/tmp/squoosh-ben2-spike/`
- Build/worker/cache architecture:
  `/tmp/squoosh-ben2-build-spike/`
- ORT external loader resolution:
  `/tmp/squoosh-ben2-jsep-loader-spike/`
- Direct 14-case cache contract:
  `/tmp/squoosh-ben2-cache-contract-spike/`
- Cancellation through normal UI/AbortSignal:
  `/tmp/squoosh-ben2-cancellation-spike/`
- Browser/deployment/provider sources:
  `/tmp/squoosh-ben2-deployment-spike/`
- GitHub/Netlify preview trigger, branch inventory, and publish readiness:
  `/tmp/squoosh-ben2-pr-path/`,
  `/tmp/squoosh-ben2-netlify-branch-report/`,
  `/tmp/squoosh-ben2-netlify-branch-review/`
- Hardware adapter/headless/headful matrix:
  `/tmp/squoosh-ben2-hardware-gpu-spike/`
- PanVK capability follow-up:
  `/tmp/squoosh-ben2-panvk-followup/`
- Temporary patched-driver execution:
  `/tmp/squoosh-ben2-patched-panvk-spike/`
- Device-loss diagnosis and ORT batching diagnostics:
  `/tmp/squoosh-ben2-panvk-device-loss/`,
  `/tmp/squoosh-ben2-ort-batch1-spike/`,
  `/tmp/squoosh-ben2-ort-submit-wait/`,
  `/tmp/squoosh-ben2-w2-corrected-matrix/`
- Canvas parity root cause:
  `/tmp/squoosh-ben2-browser-parity-debug/`
- Deterministic resize design:
  `/tmp/squoosh-ben2-reference-resize-design/`
- Portable preprocessing implementation/review:
  `/tmp/squoosh-ben2-preprocess-parity-spike/`,
  `/tmp/squoosh-ben2-preprocess-parity-review/`
- Clean branch/reproducible build review:
  `/tmp/squoosh-ben2-netlify-branch-report/`,
  `/tmp/squoosh-ben2-netlify-branch-review/`
- Machine-specific rollback proof:
  `/tmp/squoosh-ben2-rollback/`

## 21. Definition of done

Engineering implementation is not done when the branch builds or one model run
returns. It is done only when all of the following are true:

- exact model acquisition, graph, and provenance records are locked;
- project owner has recorded the redistribution/notices decision;
- production code uses the ordinary generated worker/bridge and stock ORT path;
- model-free preprocessing/matte tests pass;
- both exact physical-browser fixture runs pass output thresholds;
- immediate and post-idle session lifecycle assertions pass;
- cancellation and terminal-recovery assertions pass;
- server-stopped new-session offline PNG run passes from the existing cache;
- PNG export decodes losslessly and JPEG/identity guidance is correct;
- representative supported-hardware timing and memory are recorded and accepted;
- authenticated Netlify preview passes large-asset, MIME, range, isolation,
  cache, offline, and update checks;
- production build contains no query-gated diagnostics, acceptance globals,
  verbose runtime logging, machine-specific patches, or runtime remote-model
  source.

Until then, this branch and this document remain a reproducible engineering
spike and a plan—not a production feature.
