import './styles.css';

const DEFAULT_TIMEOUT = 2750;

export interface SnackBarOptions {
  message: string;
  timeout?: number;
  actionText?: string;
  actionHandler?: () => boolean | null;
}

class SnackBar {
  onremove?: () => void;
  private _options: SnackBarOptions;
  private _element: Element = document.createElement('div');
  private _text: Element = document.createElement('div');
  private _button: Element = document.createElement('button');
  private _parent: Element;
  private _showing = false;
  private _closeTimer?: number;

  constructor (options: SnackBarOptions, parent: Element) {
    this._options = options;
    this._parent = parent;

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
      this._button.addEventListener('click', (event) => {
        if (this._showing && options.actionHandler && options.actionHandler() === false) return;
        this.hide();
      });
      this._element.appendChild(this._button);
    }
  }

  cancelTimer () {
    if (this._closeTimer != null) clearTimeout(this._closeTimer);
  }

  show () {
    if (this._showing) return;
    this._showing = true;
    this.cancelTimer();
    this._parent.appendChild(this._element);
    this._element.removeAttribute('aria-hidden');
    this._closeTimer = setTimeout(this.hide.bind(this), this._options.timeout || DEFAULT_TIMEOUT);
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
    this._parent.removeChild(this._element);
    if (this.onremove) this.onremove();
  }
}

export default class SnackBarElement extends HTMLElement {
  private _snackbars: SnackBar[] = [];

  showSnackbar (options: SnackBarOptions) {
    const snackbar = new SnackBar(options, this);
    this._snackbars.push(snackbar);
    this._processStack();
  }

  private _processStack () {
    if (this._snackbars.length === 0) return;
    const snackbar = this._snackbars[0];
    snackbar.onremove = this._handleSnackBarRemoved.bind(this);
    snackbar.show();
  }

  private _handleSnackBarRemoved () {
    this._snackbars.shift();
    this._processStack();
  }
}

customElements.define('snack-bar', SnackBarElement);
