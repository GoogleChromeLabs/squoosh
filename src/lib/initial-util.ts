// This file contains the utils that are needed for the very first rendering of the page. They're
// here because WebPack isn't quite smart enough to split things in the same file.

/**
 * A decorator that binds values to their class instance.
 * @example
 * class C {
 *   @bind
 *   foo () {
 *     return this;
 *   }
 * }
 * let f = new C().foo;
 * f() instanceof C;    // true
 */
export function bind(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return {
    // the first time the prototype property is accessed for an instance,
    // define an instance property pointing to the bound function.
    // This effectively "caches" the bound prototype method as an instance property.
    get() {
      const bound = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound,
      });
      return bound;
    },
  };
}

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

// Edge doesn't support `new File`, so here's a hacky alternative.
// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9551546/
export class Fileish extends Blob {
  constructor(data: any[], public name: string, opts?: BlobPropertyBag) {
    super(data, opts);
  }
}
