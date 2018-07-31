import './styles.css';

const DEFAULT_TIMEOUT = 2750;

export interface SnackOptions {
  message: string;
  timeout?: number;
  actionText?: string;
  actionHandler?: () => boolean | null;
}

class Snack {
  private _onremove: (() => void)[] = [];
  private _options: SnackOptions;
  private _element: Element = document.createElement('div');
  private _text: Element = document.createElement('div');
  private _button: Element = document.createElement('button');
  private _showing = false;
  private _closeTimer?: number;

  constructor (options: SnackOptions) {
    this._options = options;

    this._element.className = 'snackbar';
    this._element.setAttribute('aria-live', 'assertive');
    this._element.setAttribute('aria-atomic', 'true');
    this._element.setAttribute('aria-hidden', 'true');

    this._text.className = 'snackbar--text';
    this._text.textContent = options.message;
    this._element.appendChild(this._text);

    if (options.actionText) {
      this._button.className = 'snackbar--button';
      this._button.textContent = options.actionText;
      this._button.addEventListener('click', () => {
        if (this._showing && options.actionHandler && options.actionHandler() === false) return;
        this.hide();
      });
      this._element.appendChild(this._button);
    }
  }

  cancelTimer () {
    if (this._closeTimer != null) clearTimeout(this._closeTimer);
  }

  show (parent: Element): Promise<void> {
    if (this._showing) return Promise.resolve();
    this._showing = true;
    this.cancelTimer();
    if (parent !== this._element.parentNode) {
      parent.appendChild(this._element);
    }
    this._element.removeAttribute('aria-hidden');
    this._closeTimer = setTimeout(this.hide.bind(this), this._options.timeout || DEFAULT_TIMEOUT);
    return new Promise((resolve) => {
      this._onremove.push(resolve);
    });
  }

  hide () {
    if (!this._showing) return;
    this._showing = false;
    this.cancelTimer();
    this._element.addEventListener('animationend', this.remove.bind(this));
    this._element.setAttribute('aria-hidden', 'true');
  }

  remove () {
    this.cancelTimer();
    const parent = this._element.parentNode;
    if (parent) parent.removeChild(this._element);
    this._onremove.forEach(f => f());
    this._onremove = [];
  }
}

export default class SnackBarElement extends HTMLElement {
  private _snackbars: Snack[] = [];

  showSnackbar (options: SnackOptions) {
    const snack = new Snack(options);
    this._snackbars.push(snack);
    this._processStack();
  }

  private _processStack () {
    if (this._snackbars.length === 0) return;
    this._snackbars[0].show(this).then(() => {
      this._snackbars.shift();
      this._processStack();
    });
  }
}

customElements.define('snack-bar', SnackBarElement);
