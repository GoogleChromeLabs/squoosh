import {
  h,
  cloneElement,
  Component,
  VNode,
  createRef,
  ComponentChildren,
  ComponentProps,
} from 'preact';
import { ClickOutsideDetector } from '../ClickOutsideDetector';
import * as style from './style.css';
import 'add-css:./style.css';

type Anchor = 'left' | 'right' | 'top' | 'bottom';
type Direction = 'left' | 'right' | 'up' | 'down';

interface Props extends ComponentProps<'aside'> {
  showing?: boolean;
  direction?: Direction | Direction[];
  anchor?: Anchor | Anchor[];
  toggle?: VNode;
  children?: ComponentChildren;
}

interface State {
  showing: boolean;
}

export default class Flyout extends Component<Props, State> {
  state = {
    showing: this.props.showing === true,
  };

  private menu = createRef<HTMLElement>();

  private hide = () => {
    this.setState({ showing: false });
  };

  private toggle = () => {
    this.setState({ showing: !this.state.showing });
  };

  componentWillReceiveProps({ showing }: Props) {
    if (showing !== this.props.showing) {
      this.setState({ showing });
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.showing && !prevState.showing) {
      const menu = this.menu.current;
      if (menu) {
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
      <span class={style.wrap} data-flyout-open={showing ? '' : undefined}>
        <ClickOutsideDetector onClick={this.hide}>
          {toggle && cloneElement(toggle, toggleProps)}

          <aside
            {...props}
            ref={this.menu}
            hidden={!showing}
            data-anchor={anchorText}
            data-direction={directionText}
          >
            {children}
          </aside>
        </ClickOutsideDetector>
      </span>
    );
  }
}
