import { h, Component, ComponentChild, ComponentChildren } from 'preact';
import * as style from './style.scss';
import { linkRef } from '../../lib/initial-util';

interface Props {
  children: ComponentChildren;
}
interface State {
  outgoingChildren: ComponentChild[];
}

export default class Expander extends Component<Props, State> {
  state: State = {
    outgoingChildren: [],
  };
  private el?: HTMLDivElement;
  private lastElHeight: number = 0;

  componentWillReceiveProps(nextProps: Props) {
    const children = this.props.children as ComponentChild[];
    const nextChildren = nextProps.children as ComponentChild[];

    if (!nextChildren[0] && children[0]) {
      // Cache the current children for the shrink animation.
      this.setState({ outgoingChildren: children });
    }
  }

  componentWillUpdate(nextProps: Props) {
    const children = this.props.children as ComponentChild[];
    const nextChildren = nextProps.children as ComponentChild[];

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if ((children[0] && nextChildren[0]) || (!children[0] && !nextChildren[0])) return;
    this.lastElHeight = this.el!.getBoundingClientRect().height;
  }

  componentDidUpdate(previousProps: Props) {
    const children = this.props.children as ComponentChild[];
    const previousChildren = previousProps.children as ComponentChild[];

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if ((children[0] && previousChildren[0]) || (!children[0] && !previousChildren[0])) return;

    // What height do we need to transition to?
    this.el!.style.transition = 'none';
    this.el!.style.height = '';
    const newHeight = children[0] ? this.el!.getBoundingClientRect().height : 0;

    if (this.lastElHeight === newHeight) {
      this.el!.style.transition = '';
      return;
    }

    // Set the currently rendered height absolutely.
    this.el!.style.height = this.lastElHeight + 'px';
    this.el!.style.transition = '';
    // Force a style calc so the browser picks up the start value.
    getComputedStyle(this.el!).height;
    // Animate to the new height.
    this.el!.style.height = newHeight + 'px';

    const listener = () => {
      // Unset the height, so element changes do the right thing.
      this.el!.style.height = '';
      this.el!.removeEventListener('transitionend', listener);
      this.el!.removeEventListener('transitioncancel', listener);
      if (this.state.outgoingChildren[0]) {
        this.setState({ outgoingChildren: [] });
      }
    };

    this.el!.addEventListener('transitionend', listener);
    this.el!.addEventListener('transitioncancel', listener);
  }

  render(props: Props, { outgoingChildren }: State) {
    const children = props.children as ComponentChild[];
    const childrenExiting = !children[0] && outgoingChildren[0];

    return (
      <div
        ref={linkRef(this, 'el')}
        class={`${style.expander} ${childrenExiting ? style.childrenExiting : ''}`}
      >
        {children[0] ? children : outgoingChildren}
      </div>
    );
  }
}
