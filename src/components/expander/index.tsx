import { h, Component, ComponentChild, ComponentChildren } from 'preact';
import * as style from './style.scss';
import { transitionHeight } from '../../lib/util';

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
    if ((children[0] && nextChildren[0]) || (!children[0] && !nextChildren[0])) return;
    this.lastElHeight = this.base!.getBoundingClientRect().height;
  }

  async componentDidUpdate(previousProps: Props) {
    const children = this.props.children as ComponentChild[];
    const previousChildren = previousProps.children as ComponentChild[];

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if ((children[0] && previousChildren[0]) || (!children[0] && !previousChildren[0])) return;

    // What height do we need to transition to?
    this.base!.style.height = '';
    this.base!.style.overflow = 'hidden';
    const newHeight = children[0] ? this.base!.getBoundingClientRect().height : 0;

    await transitionHeight(this.base!, {
      duration: 300,
      from: this.lastElHeight,
      to: newHeight,
    });

    // Unset the height & overflow, so element changes do the right thing.
    this.base!.style.height = '';
    this.base!.style.overflow = '';
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
