import { h, Component, VNode, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { linkRef } from 'shared/prerendered-app/util';
import { cleanSet } from '../util/clean-modify';

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

  private dialogElement!: HTMLDialogElement;
  static modalInstance?: Modal | undefined;

  componentDidMount() {
    // Once a transition ends, check if the modal should be closed (not just hidden)
    // dialog.close() instantly hides the modal, so we call it AFTER fading it out i.e. on transition end
    this.dialogElement.addEventListener(
      'transitionend',
      this._closeOnTransitionEnd.bind(this),
    );
    this.dialogElement.setAttribute('inert', 'enabled');

    Modal.modalInstance = this;
  }

  private _closeOnTransitionEnd() {
    // If modal does not exist
    // Or if it's not being closed at the moment
    if (
      !this.dialogElement ||
      !this.dialogElement.classList.contains(style.modalClosing)
    )
      return;

    this.dialogElement.close();
    this.dialogElement.classList.remove(style.modalClosing);
    this.dialogElement.setAttribute('inert', 'enabled');
  }

  static showModal(message: ModalMessage) {
    Modal.modalInstance?._showModal(message);
  }

  static hideModal() {
    Modal.modalInstance?._hideModal();
  }

  private _showModal(message: ModalMessage) {
    if (!this.dialogElement) throw Error('Modal missing');

    this.setState({
      message: message,
      shown: true,
    });

    // Actually show the modal
    this.dialogElement.removeAttribute('inert');
    this.dialogElement.showModal();
  }

  private _hideModal() {
    if (!this.dialogElement || !this.dialogElement.open)
      throw Error('Modal missing / hidden');

    // Make the modal fade out
    this.dialogElement.classList.add(style.modalClosing);

    this.setState(cleanSet(this.state, 'shown', false));
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

  render({}: Props, { message, shown }: State) {
    return (
      <dialog
        ref={linkRef(this, 'dialogElement')}
        onKeyDown={(e) => this._onKeyDown(e)}
      >
        <header class={style.header}>
          <span class={style.modalIcon}>{message.icon}</span>
          <span class={style.modalTitle}>{message.title}</span>
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
          <article class={style.content}>{message.content}</article>
        </div>
        <footer class={style.footer}></footer>
      </dialog>
    );
  }
}
