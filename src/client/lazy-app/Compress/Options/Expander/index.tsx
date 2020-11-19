import { h, Component, ComponentChild, ComponentChildren } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { transitionHeight } from '../../../util';

interface Props {
  children: ComponentChildren;
}
interface State {
  children: ComponentChildren;
  outgoingChildren: ComponentChildren;
}

export default class Expander extends Component<Props, State> {
  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    if (!props.children && state.children) {
      return { children: props.children, outgoingChildren: state.children };
    }

    if (props.children !== state.children) {
      return { children: props.children, outgoingChildren: undefined };
    }

    return null;
  }

  async componentDidUpdate(_: Props, previousState: State) {
    let heightFrom: number;
    let heightTo: number;

    if (previousState.children && !this.state.children) {
      heightFrom = (this.base as HTMLElement).getBoundingClientRect().height;
      heightTo = 0;
    } else if (!previousState.children && this.state.children) {
      heightFrom = 0;
      heightTo = (this.base as HTMLElement).getBoundingClientRect().height;
    } else {
      return;
    }

    (this.base as HTMLElement).style.overflow = 'hidden';

    await transitionHeight(this.base as HTMLElement, {
      duration: 300,
      from: heightFrom,
      to: heightTo,
    });

    // Unset the height & overflow, so element changes do the right thing.
    (this.base as HTMLElement).style.height = '';
    (this.base as HTMLElement).style.overflow = '';

    this.setState({ outgoingChildren: undefined });
  }

  render({}: Props, { children, outgoingChildren }: State) {
    return (
      <div class={outgoingChildren ? style.childrenExiting : ''}>
        {outgoingChildren || children}
      </div>
    );
  }
}
