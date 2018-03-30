import { Component, ComponentProps } from 'preact';

type WhenProps = ComponentProps<When> & {
  value: boolean,
  children?: (JSX.Element | (() => JSX.Element))[]
};

type WhenState = {
  ready: boolean
};

export class When extends Component<WhenProps, WhenState> {
  state: WhenState = {
    ready: !!this.props.value
  };

  render({ value, children = [] }: WhenProps, { ready }: WhenState) {
    let child = children[0];
    if (value && !ready) this.setState({ ready: true });
    return ready ? (typeof child === 'function' ? child() : child) : null;
  }
}

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
      let boundFunction = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: boundFunction
      });
      return boundFunction;
    }
  };
}
