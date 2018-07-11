import './styles.css';

const DEFAULT_TIMEOUT = 2750;

export interface SnackBarOptions {
  message: string;
  timeout?: number;
  actionText?: string;
  actionHandler?: () => boolean | null;
}

class SnackBar {
  on?: () => void;
  onhide?: () => void;
  private options: SnackBarOptions;
  private element: Element = document.createElement('div');
  private text: Element = document.createElement('div');
  private button: Element = document.createElement('button');
  private parent: Element;
  private showing = false;
  private closeTimer?: number;

  constructor (options: SnackBarOptions, parent: Element) {
    this.options = options;
    this.parent = parent;

    this.element.className = 'snackbar';
    this.element.setAttribute('aria-live', 'assertive');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.setAttribute('aria-hidden', 'true');

    this.text.className = 'snackbar--text';
    this.text.textContent = options.message;
    this.element.appendChild(this.text);

    if (options.actionText) {
      this.button.className = 'snackbar--button';
      this.button.textContent = options.actionText || '';
      this.button.addEventListener('click', (event) => {
        if (options.actionHandler && options.actionHandler() === false) return;
        this.hide();
      });
      this.element.appendChild(this.button);
    }
  }

  cancelTimer () {
    if (this.closeTimer != null) clearTimeout(this.closeTimer);
  }

  show () {
    if (this.showing) return;
    this.showing = true;
    this.cancelTimer();
    this.parent.appendChild(this.element);
    this.element.removeAttribute('aria-hidden');
    this.closeTimer = setTimeout(this.hide.bind(this), this.options.timeout || DEFAULT_TIMEOUT);
  }

  hide () {
    if (!this.showing) return;
    this.showing = false;
    this.cancelTimer();
    this.element.addEventListener('animationend', this.remove.bind(this));
    this.element.addEventListener('transitionend', this.remove.bind(this));
    this.element.setAttribute('aria-hidden', 'true');
  }

  remove () {
    this.cancelTimer();
    this.parent.removeChild(this.element);
    if (this.onhide) this.onhide();
  }
}

export default class SnackBarElement extends HTMLElement {
  private _snackbars: SnackBar[] = [];

  showSnackbar (options: SnackBarOptions) {
    const snackbar = new SnackBar(options, this.ownerDocument.body);
    this._snackbars.push(snackbar);
    this._processStack();
  }

  _processStack () {
    if (this._snackbars.length === 0) return;
    const snackbar = this._snackbars[0];
    snackbar.onhide = this.handleSnackBarRemoved.bind(this);
    snackbar.show();
  }

  handleSnackBarRemoved () {
    this._snackbars = this._snackbars.slice(1);
    this._processStack();
  }
}

customElements.define('snack-bar', SnackBarElement);
