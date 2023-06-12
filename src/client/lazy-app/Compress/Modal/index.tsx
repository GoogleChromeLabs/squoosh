import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { linkRef } from 'shared/prerendered-app/util';
import {
  InfoIcon,
  DiamondStarIcon,
  ModalErrorIcon,
} from 'client/lazy-app/icons';

interface Props {}

export interface ModalMessage {
  type: 'info' | 'error' | 'update';
  title: string;
  content: string;
}

interface State {
  message: ModalMessage;
  shown: boolean;
}

export default class Modal extends Component<Props, State> {
  state: State = {
    message: {
      type: 'info',
      title: 'default',
      content: 'default',
    },
    shown: false,
  };

  private modal?: HTMLElement;
  private returnFocusElement?: HTMLElement | null;

  showModal(message: ModalMessage) {
    if (this.state.shown) return;
    if (!this.modal) return;

    // Set element to return focus to after hiding
    this.returnFocusElement = document.activeElement as HTMLElement;

    this.modal.style.display = '';
    this.setState({
      message: message,
      shown: true,
    });
    // Wait for the 'display' reset to take place, then focus
    setTimeout(() => {
      this.modal?.querySelector('button')?.focus();
    }, 0);
  }

  hideModal() {
    this.setState({
      message: { ...this.state.message },
      shown: false,
    });
    setTimeout(() => {
      this.modal && (this.modal.style.display = 'none');
      this.returnFocusElement?.focus();
    }, 250);
  }

  private _getCloseButton() {
    return this.modal!.querySelector('button')!;
  }

  private _getLastFocusable() {
    const focusables = this.modal!.querySelectorAll('button, a');
    return focusables[focusables.length - 1] as HTMLElement;
  }

  private _onKeyDown(e: KeyboardEvent) {
    // If Escape, hide modal
    if (e.key === 'Escape' || e.keyCode == 27) {
      this.hideModal();
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

    if (!isTabPressed) return;

    if (e.shiftKey) {
      // If SHIFT + TAB was pressed on the first focusable element
      // Move focus to the last focusable element
      if (document.activeElement === this._getCloseButton()) {
        this._getLastFocusable().focus();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    } else {
      // If TAB was pressed on the last focusable element
      // Move focus to the first focusable element
      if (document.activeElement === this._getLastFocusable()) {
        this._getCloseButton().focus();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }

  render({}: Props, { message, shown }: State) {
    return (
      <div
        class={`${style.modalOverlay} ${shown && style.modalShown}`}
        onKeyDown={(e) => this._onKeyDown(e)}
        tabIndex={shown ? 0 : -1}
      >
        <div class={style.modal} ref={linkRef(this, 'modal')}>
          <header class={style.header}>
            <span class={style.modalTypeIcon}>
              {message.type === 'info' ? (
                <InfoIcon />
              ) : message.type === 'error' ? (
                <ModalErrorIcon />
              ) : (
                <DiamondStarIcon />
              )}
            </span>
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
            <article
              class={style.content}
              dangerouslySetInnerHTML={{ __html: message.content }}
            ></article>
          </div>
          <footer class={style.footer}></footer>
        </div>
      </div>
    );
  }
}
