import {
  Component,
  cloneElement,
  createRef,
  toChildArray,
  ComponentChildren,
  RefObject,
} from 'preact';

interface Props {
  children: ComponentChildren;
  onClick?(e: MouseEvent | KeyboardEvent): void;
}

export class ClickOutsideDetector extends Component<Props> {
  private _roots: RefObject<Element>[] = [];

  private handleClick = (e: MouseEvent) => {
    let target = e.target as Node;
    // check if the click came from within any of our child elements:
    for (const { current: root } of this._roots) {
      if (root && (root === target || root.contains(target))) return;
    }
    const { onClick } = this.props;
    if (onClick) onClick(e);
  };

  private handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const { onClick } = this.props;
      if (onClick) onClick(e);
    }
  };

  componentDidMount() {
    addEventListener('click', this.handleClick, { passive: true });
    addEventListener('keydown', this.handleKey, { passive: true });
  }

  componentWillUnmount() {
    removeEventListener('click', this.handleClick);
    removeEventListener('keydown', this.handleKey);
  }

  render({ children }: Props) {
    this._roots = [];
    return toChildArray(children).map((child) => {
      if (typeof child !== 'object') return child;
      const ref = createRef();
      this._roots.push(ref);
      return cloneElement(child, { ref });
    });
  }
}
