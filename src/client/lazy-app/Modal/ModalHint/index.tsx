import { h, Component, VNode } from 'preact';
import Modal from '..';
import { InfoIcon } from 'client/lazy-app/icons';
import { linkRef } from 'shared/prerendered-app/util';

import * as style from './style.css';
import 'add-css:./style.css';

interface Props {
  modalTitle: string;
  text?: string;
}

interface State {}

export default class ModalHint extends Component<Props, State> {
  private modalComponent?: Modal;

  private onclick = (event: Event) => {
    if (!this.modalComponent)
      throw new Error('ModalHint is missing a modalComponent');

    // Stop bubbled events from triggering the modal
    if (!(event.currentTarget as Element).matches('button')) return;

    this.modalComponent.showModal();
  };

  render({ modalTitle, text }: Props) {
    return (
      <span
        class={style.modalHint}
        onClick={(event) => {
          // When the button is clicked, the event starts bubbling up
          // which might cause unexpected behaviour
          event.preventDefault();
          event.stopImmediatePropagation();
        }}
      >
        <button
          class={style.modalButton}
          onClick={this.onclick}
          title="Learn more"
        >
          <InfoIcon></InfoIcon>
          {text}
        </button>
        <Modal
          ref={linkRef(this, 'modalComponent')}
          icon={<InfoIcon></InfoIcon>}
          title={modalTitle}
          content={this.props.children as any}
        ></Modal>
      </span>
    );
  }
}