function cleanSetOrMerge<A = any[] | object>(
  source: A,
  keys: string | string[],
  toSetOrMerge: any[] | object,
  merge: boolean,
): A {
  const splitKeys = typeof keys === 'string' ? keys.split('.') : keys;

  // Going off road in terms of types, otherwise TypeScript doesn't like the access-by-index.
  // The assumptions in this code break if the object contains things which aren't arrays or
  // plain objects.
  let last = copy(source) as any;
  const newObject = last;

  const lastIndex = splitKeys.length - 1;

  for (const [i, key] of splitKeys.entries()) {
    if (i !== lastIndex) {
      // Copy everything along the path.
      last = last[key] = copy(last[key]);
    } else {
      // Merge or set.
      last[key] = merge ?
        Object.assign(copy(last[key]), toSetOrMerge) :
        toSetOrMerge;
    }
  }

  return newObject;
}

function copy<A = any[] | object>(source: A): A {
  // Some type cheating here, as TypeScript can't infer between generic types.
  if (Array.isArray(source)) return [...source] as any;
  return { ...(source as any) };
}

/**
 * @param {(any[] | object)} source Object to copy from.
 * @param {(string | string[])} keys Path to modify, eg "foo.bar.baz".
 * @param {(any[] | object)} toMerge A value to merge into the value at the path.
 */
export function cleanMerge<A = any[] | object>(
  source: A,
  keys: string | string[],
  toMerge: any[] | object,
): A {
  return cleanSetOrMerge(source, keys, toMerge, true);
}

/**
 * @param {(any[] | object)} source Object to copy from.
 * @param {(string | string[])} keys Path to modify, eg "foo.bar.baz".
 * @param {(any[] | object)} newValue A value to set at the path.
 */
export function cleanSet<A = any[] | object>(
  source: A,
  keys: string | string[],
  newValue: any,
): A {
  return cleanSetOrMerge(source, keys, newValue, false);
}
