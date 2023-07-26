import { h, Component, VNode, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { linkRef } from 'shared/prerendered-app/util';
import { cleanSet } from '../util/clean-modify';
import { animateTo } from '../util';

interface Props {
  icon: VNode;
  title: string;
  content: VNode;
}

interface State {
  shown: boolean;
}

export default class Modal extends Component<Props, State> {
  private dialogElement?: HTMLDialogElement;

  componentDidMount() {
    if (!this.dialogElement) throw new Error('Modal missing');

    // Set inert by default
    this.dialogElement.inert = true;

    // Prevent events from leaking through the dialog
    this.dialogElement.onclick = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
  }

  private _closeOnTransitionEnd = () => {
    // If modal does not exist
    if (!this.dialogElement) return;

    this.dialogElement.close();
    this.dialogElement.inert = true;
    this.setState({ shown: false });
  };

  showModal() {
    if (!this.dialogElement || this.dialogElement.open)
      throw Error('Modal missing / already shown');

    this.dialogElement.inert = false;
    this.dialogElement.showModal();
    // animate modal opening
    animateTo(
      this.dialogElement,
      [
        { opacity: 0, transform: 'translateY(50px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: 250, easing: 'ease' },
    );
    // animate modal::backdrop
    animateTo(this.dialogElement, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 250,
      easing: 'linear',
      pseudoElement: '::backdrop',
    });
    this.setState({ shown: true });
  }

  private _hideModal() {
    if (!this.dialogElement || !this.dialogElement.open)
      throw Error('Modal missing / hidden');

    // animate modal closing
    const anim = animateTo(
      this.dialogElement,
      { opacity: 0, transform: 'translateY(50px)' },
      { duration: 250, easing: 'ease' },
    );
    // animate modal::backdrop
    animateTo(this.dialogElement, [{ opacity: 0 }], {
      duration: 250,
      easing: 'linear',
      pseudoElement: '::backdrop',
    });
    anim.onfinish = this._closeOnTransitionEnd;
  }

  private _onKeyDown(e: KeyboardEvent) {
    // Default behaviour of <dialog> closes it instantly when you press Esc
    // So we hijack it to smoothly hide the modal
    if (e.key === 'Escape') {
      this._hideModal();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  render({ title, icon, content }: Props, { shown }: State) {
    return (
      <dialog
        ref={linkRef(this, 'dialogElement')}
        onKeyDown={(e) => this._onKeyDown(e)}
      >
        {shown && (
          <Fragment>
            <header class={style.header}>
              <span class={style.modalIcon}>{icon}</span>
              <span class={style.modalTitle}>{title}</span>
              <button
                class={style.closeButton}
                onClick={() => this._hideModal()}
              >
                <svg viewBox="0 0 480 480" fill="currentColor">
                  <path
                    d="M119.356 120L361 361M360.644 120L119 361"
                    stroke="#fff"
                    stroke-width="37"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </header>
            <div class={style.contentContainer}>
              <article class={style.content}>{content}</article>
            </div>
            <footer class={style.footer}></footer>
          </Fragment>
        )}
      </dialog>
    );
  }
}
