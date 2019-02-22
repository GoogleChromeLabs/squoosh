import * as styles from './styles.css';

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
export default class LoadingSpinner extends HTMLElement {
  private _delayTimeout: number = 0;

  constructor() {
    super();

    // Ideally we'd use shadow DOM here, but we're targeting browsers without shadow DOM support.
    // You can't set attributes/content in a custom element constructor, so I'm waiting a microtask.
    Promise.resolve().then(() => {
      this.style.display = 'none';
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
    });
  }

  disconnectedCallback() {
    this.style.display = 'none';
    clearTimeout(this._delayTimeout);
  }

  connectedCallback() {
    const delayStr = getComputedStyle(this).getPropertyValue('--delay').trim();
    let delayNum = parseFloat(delayStr);

    // If seconds…
    if (/\ds$/.test(delayStr)) {
      // Convert to ms.
      delayNum *= 1000;
    }

    this._delayTimeout = self.setTimeout(
      () => { this.style.display = ''; },
      delayNum,
    );
  }
}

customElements.define('loading-spinner', LoadingSpinner);
