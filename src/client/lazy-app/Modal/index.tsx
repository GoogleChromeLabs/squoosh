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

interface State {}

export default class Modal extends Component<Props, State> {
  private dialogElement?: HTMLDialogElement;

  componentDidMount() {
    if (!this.dialogElement) throw new Error('Modal missing');
  }

  private _closeOnTransitionEnd = () => {
    // If modal does not exist
    if (!this.dialogElement) return;

    this.dialogElement.close();
  };

  showModal() {
    if (!this.dialogElement) throw Error('Modal missing');
    if (this.dialogElement.open) return;

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
    // some browsers don't support ::backdrop, catch those errors
    try {
      animateTo(this.dialogElement, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 250,
        easing: 'ease',
        pseudoElement: '::backdrop',
      });
    } catch (e) {}
  }

  private _hideModal() {
    if (!this.dialogElement) throw Error('Modal missing / hidden');
    if (!this.dialogElement.open) return;

    // animate modal closing
    const anim = animateTo(
      this.dialogElement,
      { opacity: 0, transform: 'translateY(50px)' },
      { duration: 250, easing: 'ease' },
    );
    // animate modal::backdrop
    // some browsers don't support ::backdrop, catch those errors
    try {
      animateTo(this.dialogElement, [{ opacity: 0 }], {
        duration: 250,
        easing: 'ease',
        pseudoElement: '::backdrop',
      });
    } catch (e) {}
    anim.onfinish = this._closeOnTransitionEnd;
  }

  private _onKeyDown = (event: KeyboardEvent) => {
    // Default behaviour of <dialog> closes it instantly when you press Esc
    // So we hijack it to smoothly hide the modal
    if (event.key === 'Escape') {
      this._hideModal();
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  render({ title, icon, content }: Props, {}: State) {
    return (
      <dialog
        class={style['modalDialog']}
        ref={linkRef(this, 'dialogElement')}
        onKeyDown={this._onKeyDown}
        onClick={(event) => {
          // Prevent clicks from leaking out of the dialog
          event.preventDefault();
          event.stopImmediatePropagation();
        }}
      >
        <article class={style.article}>
          <header class={style.header}>
            <span class={style.modalIcon}>{icon}</span>
            <span class={style.modalTitle}>{title}</span>
            <button class={style.closeButton} onClick={() => this._hideModal()}>
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
        </article>
      </dialog>
    );
  }
}
