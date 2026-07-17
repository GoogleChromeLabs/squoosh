import modelUrl from 'url:../../../../../.tmp/ben2/model_fp16.onnx';
import { modelBytes } from './meta';

export const ben2ModelCacheName = 'squoosh-ben2-model-v1';

const downloadLockName = 'squoosh-ben2-model-v1-download';
const validationHeader = 'X-Squoosh-BEN2-Validated';
const downloadHeader = 'X-Squoosh-BEN2-Download';
const downloadHeaderValue = 'v1';
const stagingParameter = 'ben2-model-staging';

interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

let currentDownload: Promise<void> | undefined;

function canonicalUrl(): URL {
  const url = new URL(modelUrl, location.href);
  if (url.origin !== location.origin || url.search || url.hash) {
    throw new Error('Invalid BEN2 model build URL');
  }
  return url;
}

function canonicalRequest(): Request {
  return new Request(canonicalUrl().href);
}

function validationMarker(): string {
  return `v1;url=${encodeURIComponent(
    canonicalUrl().href,
  )};bytes=${modelBytes}`;
}

function isValidatedResponse(
  response: Response | undefined,
): response is Response {
  return !!(
    response &&
    response.type !== 'opaque' &&
    response.status === 200 &&
    response.headers.get(validationHeader) === validationMarker() &&
    response.headers.get('Content-Length') === String(modelBytes)
  );
}

async function matchInCache(cache: Cache): Promise<Response | undefined> {
  const request = canonicalRequest();
  const response = await cache.match(request);
  if (isValidatedResponse(response)) return response;
  if (response) {
    try {
      await cache.delete(request);
    } catch {}
  }
}

/** Match only the fixed, marked model entry in the dedicated current cache. */
export async function matchValidatedBen2Model(): Promise<Response | undefined> {
  const cacheNames = await caches.keys();
  if (!cacheNames.includes(ben2ModelCacheName)) return;
  return matchInCache(await caches.open(ben2ModelCacheName));
}

export async function ben2ModelIsCached(): Promise<boolean> {
  return !!(await matchValidatedBen2Model());
}

function isCanonicalModelRequest(request: Request): boolean {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    url.href === canonicalUrl().href &&
    url.origin === location.origin &&
    url.search === '' &&
    !request.headers.has('range')
  );
}

/** Identify the one internal main-thread request that the SW may pass through. */
export function isBen2ModelDownloadRequest(request: Request): boolean {
  return (
    isCanonicalModelRequest(request) &&
    request.headers.get(downloadHeader) === downloadHeaderValue
  );
}

function stagingRequest(): Request {
  const url = canonicalUrl();
  const cryptoWithUuid = globalThis.crypto as Crypto & {
    randomUUID?: () => string;
  };
  const id =
    cryptoWithUuid.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  url.searchParams.set(stagingParameter, id);
  return new Request(url.href);
}

function isStagingRequest(request: Request): boolean {
  const url = new URL(request.url);
  const expected = canonicalUrl();
  return (
    url.origin === expected.origin &&
    url.pathname === expected.pathname &&
    url.searchParams.has(stagingParameter)
  );
}

async function reapObsoleteEntries(cache: Cache): Promise<void> {
  const canonical = canonicalUrl().href;
  const requests = await cache.keys();
  await Promise.all(
    requests.map((request) => {
      if (request.url === canonical) return;
      return cache.delete(request).catch(() => false);
    }),
  );
}

function explicitDownloadRequest(): Request {
  const headers = new Headers();
  headers.set(downloadHeader, downloadHeaderValue);
  return new Request(canonicalUrl().href, {
    method: 'GET',
    headers,
    credentials: 'same-origin',
    redirect: 'error',
  });
}

async function deleteInvalidCanonical(cache: Cache): Promise<void> {
  try {
    const request = canonicalRequest();
    const response = await cache.match(request);
    if (response && !isValidatedResponse(response)) await cache.delete(request);
  } catch {}
}

async function performDownload(serialized: boolean): Promise<void> {
  const request = canonicalRequest();
  const stage = stagingRequest();
  let cache: Cache | undefined;

  try {
    cache = await caches.open(ben2ModelCacheName);
    if (serialized) await reapObsoleteEntries(cache);
    if (await matchInCache(cache)) return;

    const response = await fetch(explicitDownloadRequest());
    if (response.type === 'opaque' || response.status !== 200) {
      throw new Error('BEN2 model response was not accepted');
    }
    if (!response.body) throw new Error('BEN2 model response had no body');

    let receivedBytes = 0;
    const validatingBody = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          receivedBytes += chunk.byteLength;
          if (receivedBytes > modelBytes) {
            throw new Error('BEN2 model response was overlong');
          }
          controller.enqueue(chunk);
        },
        flush() {
          if (receivedBytes !== modelBytes) {
            throw new Error('BEN2 model response was short');
          }
        },
      }),
    );
    const stagingHeaders = new Headers(response.headers);
    stagingHeaders.delete(validationHeader);
    stagingHeaders.delete('Content-Length');
    await cache.put(
      stage,
      new Response(validatingBody, {
        status: response.status,
        statusText: response.statusText,
        headers: stagingHeaders,
      }),
    );

    const staged = await cache.match(stage);
    if (!staged?.body) throw new Error('BEN2 staging write was unavailable');
    const admittedHeaders = new Headers(staged.headers);
    admittedHeaders.set('Content-Length', String(modelBytes));
    admittedHeaders.set(validationHeader, validationMarker());
    await cache.put(
      request,
      new Response(staged.body, {
        status: staged.status,
        statusText: staged.statusText,
        headers: admittedHeaders,
      }),
    );
    if (!(await matchInCache(cache))) {
      throw new Error('BEN2 final cache write was unavailable');
    }
    await cache.delete(stage);
  } catch (error) {
    if (cache) {
      await cache.delete(stage).catch(() => false);
      await deleteInvalidCanonical(cache);
    }
    throw error;
  }
}

async function lockedDownload(): Promise<void> {
  const locks = (
    globalThis as typeof globalThis & {
      navigator?: { locks?: LockManagerLike };
    }
  ).navigator?.locks;
  if (!locks?.request) return performDownload(false);
  return locks.request(downloadLockName, () => performDownload(true));
}

/** Download and stream-admit the fixed model, shared by all callers in a page. */
export function downloadBen2Model(): Promise<void> {
  if (!currentDownload) {
    const tracked = lockedDownload().finally(() => {
      if (currentDownload === tracked) currentDownload = undefined;
    });
    currentDownload = tracked;
  }
  return currentDownload;
}

function modelNotCachedError(cause?: unknown): Error {
  const message = 'The current BEN2 model is not cached';
  const error = new Error(
    cause instanceof Error && cause.message
      ? `${message}: ${cause.message}`
      : message,
  );
  error.name = 'Ben2ModelNotCachedError';
  return error;
}

/** Materialize the one validated cached model body. This function never fetches. */
export async function readCachedBen2ModelBytes(): Promise<Uint8Array> {
  let response: Response | undefined;
  try {
    response = await matchValidatedBen2Model();
    if (!response) throw modelNotCachedError();
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== modelBytes) {
      throw modelNotCachedError();
    }
    return new Uint8Array(buffer);
  } catch (error) {
    try {
      const cacheNames = await caches.keys();
      if (cacheNames.includes(ben2ModelCacheName)) {
        await (
          await caches.open(ben2ModelCacheName)
        ).delete(canonicalRequest());
      }
    } catch {}
    if ((error as Error)?.name === 'Ben2ModelNotCachedError') throw error;
    throw modelNotCachedError(error);
  }
}

/** Remove current canonical and staging entries without scanning other caches. */
export async function evictBen2Model(): Promise<void> {
  const cacheNames = await caches.keys();
  if (!cacheNames.includes(ben2ModelCacheName)) return;
  const cache = await caches.open(ben2ModelCacheName);
  const requests = await cache.keys();
  await Promise.all(
    requests.map((request) => {
      if (request.url === canonicalUrl().href || isStagingRequest(request)) {
        return cache.delete(request);
      }
    }),
  );
}
