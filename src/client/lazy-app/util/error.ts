export function isAbortError(e: unknown) {
  return e instanceof Error && e.name === 'AbortError';
}
