import { h, Component, VNode, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { linkRef } from 'shared/prerendered-app/util';

interface Props {}

export interface ModalMessage {
  icon: VNode;
  title: string;
  content: VNode;
}

interface State {
  message: ModalMessage;
  shown: boolean;
}

export default class Modal extends Component<Props, State> {
  state: State = {
    message: {
      icon: <svg></svg>,
      title: 'default',
      content: <Fragment></Fragment>,
    },
    shown: false,
  };

  private modal?: HTMLDialogElement;

  componentDidMount() {
    // Once a transition ends, check if the modal should be closed (not just hidden)
    // dialog.close() instantly hides the modal, so we call it AFTER fading it out i.e. on transition end
    this.modal?.addEventListener(
      'transitionend',
      this._closeOnTransitionEnd.bind(this),
    );
    this.modal?.setAttribute('inert', 'enabled');
  }

  private _closeOnTransitionEnd() {
    // If modal does not exist
    // Or if it's not being closed at the moment
    if (!this.modal || !this.modal.classList.contains(style.modalClosing))
      return;

    this.modal.close();
    this.modal.classList.remove(style.modalClosing);
    this.modal.setAttribute('inert', 'enabled');
  }

  /**
   * Function to set up the modal and show it
   */
  showModal(message: ModalMessage) {
    if (!this.modal) return;

    this.setState({
      message: message,
      shown: true,
    });

    // Actually show the modal
    this.modal.removeAttribute('inert');
    this.modal.showModal();
  }

  /**
   * Function to hide the modal with a fade-out transition
   * Adds the `modal--closing` class which is removed on transition end
   */
  hideModal() {
    if (!this.modal || !this.modal.open) return;

    // Make the modal fade out
    this.modal.classList.add(style.modalClosing);

    this.setState({
      message: { ...this.state.message },
      shown: false,
    });
  }

  private _onKeyDown(e: KeyboardEvent) {
    // Default behaviour of <dialog> closes it instantly when you press Esc
    // So we hijack it to smoothly hide the modal
    if (e.key === 'Escape' || e.keyCode == 27) {
      this.hideModal();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  render({}: Props, { message, shown }: State) {
    return (
      <dialog
        ref={linkRef(this, 'modal')}
        onKeyDown={(e) => this._onKeyDown(e)}
      >
        <header class={style.header}>
          <span class={style.modalIcon}>{message.icon}</span>
          <span class={style.modalTitle}>{message.title}</span>
          <button class={style.closeButton} onClick={() => this.hideModal()}>
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
          <article class={style.content}>{message.content}</article>
        </div>
        <footer class={style.footer}></footer>
      </dialog>
    );
  }
}
