import * as styles from './styles.css';

export default class LoadingSpinner extends HTMLElement {
  private delayTimeout: number = 0;

  constructor() {
    super();

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
    clearTimeout(this.delayTimeout);
  }

  connectedCallback() {
    const delayStr = getComputedStyle(this).getPropertyValue('--delay').trim();
    let delayNum = parseFloat(delayStr);

    if (/\ds$/.test(delayStr)) {
      delayNum *= 1000;
    }

    this.delayTimeout = self.setTimeout(
      () => { this.style.display = ''; },
      delayNum,
    );
  }
}

customElements.define('loading-spinner', LoadingSpinner);
