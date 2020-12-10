import {
  h,
  cloneElement,
  Component,
  VNode,
  createRef,
  ComponentChildren,
  ComponentProps,
  Fragment,
  render,
} from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';

type Anchor = 'left' | 'right' | 'top' | 'bottom';
type Direction = 'left' | 'right' | 'up' | 'down';

const has = (haystack: string | string[] | undefined, needle: string) =>
  Array.isArray(haystack) ? haystack.includes(needle) : haystack === needle;

interface Props extends ComponentProps<'aside'> {
  showing?: boolean;
  direction?: Direction | Direction[];
  anchor?: Anchor;
  toggle?: VNode;
  children?: ComponentChildren;
}

interface State {
  showing: boolean;
  hasShown: boolean;
}

export default class Flyout extends Component<Props, State> {
  state = {
    showing: this.props.showing === true,
    hasShown: this.props.showing === true,
  };

  private wrap = createRef<HTMLElement>();

  private menu = createRef<HTMLElement>();

  private resizeObserver?: ResizeObserver;

  private shown?: number;

  private dismiss = (event: Event) => {
    if (this.menu.current && this.menu.current.contains(event.target as Node))
      return;
    // prevent toggle buttons from immediately dismissing:
    if (this.shown && Date.now() - this.shown < 10) return;
    this.setShowing(false);
  };

  private setShowing = (showing?: boolean) => {
    this.shown = Date.now();
    if (showing) this.setState({ showing: true, hasShown: true });
    else this.setState({ showing: false });
  };

  private toggle = () => {
    this.setShowing(!this.state.showing);
  };

  private reposition = () => {
    const menu = this.menu.current;
    const wrap = this.wrap.current;
    if (!menu || !wrap || !this.state.showing) return;
    const bbox = wrap.getBoundingClientRect();

    const { direction = 'down', anchor = 'right' } = this.props;
    const { innerWidth, innerHeight } = window;

    const anchorX = has(anchor, 'left') ? bbox.left : bbox.right;

    menu.style.left = menu.style.right = menu.style.top = menu.style.bottom =
      '';

    if (has(direction, 'left')) {
      menu.style.right = innerWidth - anchorX + 'px';
    } else {
      menu.style.left = anchorX + 'px';
    }
    if (has(direction, 'up')) {
      const anchorY = has(anchor, 'bottom') ? bbox.bottom : bbox.top;
      menu.style.bottom = innerHeight - anchorY + 'px';
    } else {
      const anchorY = has(anchor, 'top') ? bbox.top : bbox.bottom;
      menu.style.top = anchorY + 'px';
    }
  };

  componentWillReceiveProps({ showing }: Props) {
    if (showing !== this.props.showing) {
      this.setShowing(showing);
    }
  }

  componentDidMount() {
    addEventListener('click', this.dismiss, { passive: true });
    addEventListener('resize', this.reposition, { passive: true });
    if (typeof ResizeObserver === 'function' && this.wrap.current) {
      this.resizeObserver = new ResizeObserver(this.reposition);
      this.resizeObserver.observe(this.wrap.current);
    }
    if (this.props.showing) this.setShowing(true);
  }

  componentWillUnmount() {
    removeEventListener('click', this.dismiss);
    removeEventListener('resize', this.reposition);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.showing && !prevState.showing) {
      const menu = this.menu.current;
      if (menu) {
        this.reposition();

        let toFocus = menu.firstElementChild;
        for (let child of menu.children) {
          if (child.hasAttribute('autofocus')) {
            toFocus = child;
            break;
          }
        }
        // @ts-ignore-next
        if (toFocus) toFocus.focus();
      }
    }
  }

  render(
    { direction, anchor, toggle, children, ...props }: Props,
    { showing }: State,
  ) {
    const toggleProps = {
      flyoutOpen: showing,
      onClick: this.toggle,
    };

    const directionText = Array.isArray(direction)
      ? direction.join(' ')
      : direction;
    const anchorText = Array.isArray(anchor) ? anchor.join(' ') : anchor;

    return (
      <span
        class={style.wrap}
        ref={this.wrap}
        data-flyout-open={showing ? '' : undefined}
      >
        {toggle && cloneElement(toggle, toggleProps)}

        {showing &&
          createPortal(
            <aside
              {...props}
              class={`${style.flyout} ${props.class || props.className || ''}`}
              ref={this.menu}
              data-anchor={anchorText}
              data-direction={directionText}
            >
              {children}
            </aside>,
            document.body,
          )}
      </span>
    );
  }
}

// not worth pulling in compat
function createPortal(children: ComponentChildren, parent: Element) {
  return <Portal parent={parent}>{children}</Portal>;
}
// this is probably overly careful, since it works directly rendering into parent
function createPersistentFragment(parent: Element) {
  const frag = {
    nodeType: 11,
    childNodes: [],
    appendChild: parent.appendChild.bind(parent),
    insertBefore: parent.insertBefore.bind(parent),
    removeChild: parent.removeChild.bind(parent),
  };
  return (frag as unknown) as Element;
}
class Portal extends Component<{
  children: ComponentChildren;
  parent: Element;
}> {
  root = createPersistentFragment(this.props.parent);
  componentWillUnmount() {
    render(null, this.root);
  }
  render() {
    render(<Fragment>{this.props.children}</Fragment>, this.root);
    return null;
  }
}
