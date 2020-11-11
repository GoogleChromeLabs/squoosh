import { h, Component, ComponentChild, ComponentChildren } from 'preact';
import * as style from './style.css';
import 'add-css:./styles.css';
import { transitionHeight } from '../../../util';

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
    if ((children[0] && nextChildren[0]) || (!children[0] && !nextChildren[0]))
      return;
    this.lastElHeight = (this
      .base as HTMLElement).getBoundingClientRect().height;
  }

  async componentDidUpdate(previousProps: Props) {
    const children = this.props.children as ComponentChild[];
    const previousChildren = previousProps.children as ComponentChild[];

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if (
      (children[0] && previousChildren[0]) ||
      (!children[0] && !previousChildren[0])
    )
      return;

    // What height do we need to transition to?
    (this.base as HTMLElement).style.height = '';
    (this.base as HTMLElement).style.overflow = 'hidden';
    const newHeight = children[0]
      ? (this.base as HTMLElement).getBoundingClientRect().height
      : 0;

    await transitionHeight(this.base as HTMLElement, {
      duration: 300,
      from: this.lastElHeight,
      to: newHeight,
    });

    // Unset the height & overflow, so element changes do the right thing.
    (this.base as HTMLElement).style.height = '';
    (this.base as HTMLElement).style.overflow = '';
    if (this.state.outgoingChildren[0]) this.setState({ outgoingChildren: [] });
  }

  render(props: Props, { outgoingChildren }: State) {
    const children = props.children as ComponentChild[];
    const childrenExiting = !children[0] && outgoingChildren[0];

    return (
      <div class={childrenExiting ? style.childrenExiting : ''}>
        {children[0] ? children : outgoingChildren}
      </div>
    );
  }
}
