import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { shallowEqual, isSafari } from '../../util';
// import { * } from '../../icons';
import { linkRef } from 'shared/prerendered-app/util';
import { ModalInfoIcon } from 'client/lazy-app/icons';

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

  showModal(message: ModalMessage) {
    this.setState({
      message: message,
      shown: true,
    });
  }

  hideModal() {
    this.setState({
      message: { ...this.state.message },
      shown: false,
    });
  }

  render({}: Props, { message, shown }: State) {
    return (
      <div class={`${style.modalOverlay} ${shown && style.modalShown}`}>
        <div class={style.modal}>
          <header class={style.header} onClick={() => this.hideModal()}>
            <div class={style.modalTitle}>
              {message.type === 'info' ? <ModalInfoIcon /> : <ModalInfoIcon />}
              <span>{message.title}</span>
            </div>
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
