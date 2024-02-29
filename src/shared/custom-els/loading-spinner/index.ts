import * as styles from './styles.css';
import 'add-css:./styles.css';

// So it doesn't cause an error when running in node
const HTMLEl = (__PRERENDER__
  ? Object
  : HTMLElement) as unknown as typeof HTMLElement;

/**
 * A simple spinner. This custom element has no JS API. Just put it in the document, and it'll
 * spin. You can configure the following using CSS custom properties:
 *
 * --size: Size of the spinner element (it's always square). Default: 28px.
 * --color: Color of the spinner. Default: #4285f4.
 * --stroke-width: Width of the stroke of the spinner. Default: 3px.
 * --delay: Once the spinner enters the DOM, how long until it shows. This prevents the spinner
 *          appearing on the screen for short operations. Default: 300ms.
 */
export default class LoadingSpinner extends HTMLEl {
  private _delayTimeout: number = 0;

  disconnectedCallback() {
    this.style.display = 'none';
    clearTimeout(this._delayTimeout);
  }

  connectedCallback() {
    this.style.display = 'none';
    // prettier-ignore
    this.innerHTML = '' +
      `<div class="${styles.spinnerContainer}">` +
        `<div class="${styles.spinnerLayer}">` +
          `<div class="${styles.spinnerCircleClipper} ${styles.spinnerLeft}">` +
            `<div class="${styles.spinnerCircle}"></div>` +
          '</div>' +
          `<div class="${styles.spinnerGapPatch}">` +
            `<div class="${styles.spinnerCircle}"></div>` +
          '</div>' +
          `<div class="${styles.spinnerCircleClipper} ${styles.spinnerRight}">` +
            `<div class="${styles.spinnerCircle}"></div>` +
          '</div>' +
        '</div>' +
      '</div>';

    const delayStr = getComputedStyle(this).getPropertyValue('--delay').trim();
    let delayNum = parseFloat(delayStr);

    // If seconds…
    if (/\ds$/.test(delayStr)) {
      // Convert to ms.
      delayNum *= 1000;
    }

    this._delayTimeout = self.setTimeout(() => {
      this.style.display = '';
    }, delayNum);
  }
}

if (!__PRERENDER__) customElements.define('loading-spinner', LoadingSpinner);
