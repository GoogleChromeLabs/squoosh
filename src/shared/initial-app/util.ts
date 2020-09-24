/** Creates a function ref that assigns its value to a given property of an object.
 *  @example
 *  // element is stored as `this.foo` when rendered.
 *  <div ref={linkRef(this, 'foo')} />
 */
export function linkRef<T>(obj: any, name: string) {
  const refName = `$$ref_${name}`;
  let ref = obj[refName];
  if (!ref) {
    ref = obj[refName] = (c: T) => {
      obj[name] = c;
    };
  }
  return ref;
}
