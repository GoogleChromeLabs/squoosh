import { cloneElement, Component } from 'preact';

export function memoizedComponent(fn: () => JSX.Element) {
  let cached: JSX.Element;
  return class extends Component<any> {
    shouldComponentUpdate(props: any) {
      for (const i in props) if (props[i] !== this.props[i]) return true;
      return false;
    }
    render (props: JSX.HTMLAttributes) {
      if (!cached) cached = fn();
      return cloneElement(cached, props);
    }
  };
}
