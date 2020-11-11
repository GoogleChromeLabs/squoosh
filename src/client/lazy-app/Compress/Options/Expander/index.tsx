import { h, Component, ComponentChild, ComponentChildren } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
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
    const children = this.props.children as ComponentChild[] | undefined;
    const nextChildren = nextProps.children as ComponentChild[] | undefined;

    if (!nextChildren && children && children[0]) {
      // Cache the current children for the shrink animation.
      this.setState({ outgoingChildren: children });
    }
  }

  componentWillUpdate(nextProps: Props) {
    const children = this.props.children as ComponentChild[] | undefined;
    const nextChildren = nextProps.children as ComponentChild[] | undefined;

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if ((children && nextChildren) || (!children && !nextChildren)) return;
    this.lastElHeight = (this
      .base as HTMLElement).getBoundingClientRect().height;
  }

  async componentDidUpdate(previousProps: Props) {
    const children = this.props.children as ComponentChild[] | undefined;
    const previousChildren = previousProps.children as
      | ComponentChild[]
      | undefined;

    // Only interested if going from empty to not-empty, or not-empty to empty.
    if ((children && previousChildren) || (!children && !previousChildren))
      return;

    // What height do we need to transition to?
    (this.base as HTMLElement).style.height = '';
    (this.base as HTMLElement).style.overflow = 'hidden';
    const newHeight = children
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
    const children = props.children as ComponentChild[] | undefined;
    const childrenExiting = (!children || !children[0]) && outgoingChildren[0];

    return (
      <div class={childrenExiting ? style.childrenExiting : ''}>
        {children && children[0] ? children : outgoingChildren}
      </div>
    );
  }
}
