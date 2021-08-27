import * as style from './style.css';
import 'add-css:./style.css';

const RETARGETED_EVENTS = ['focus', 'blur'];
const UPDATE_EVENTS = ['input', 'change'];
const REFLECTED_PROPERTIES = [
  'name',
  'min',
  'max',
  'step',
  'value',
  'disabled',
];
const REFLECTED_ATTRIBUTES = [
  'name',
  'min',
  'max',
  'step',
  'value',
  'disabled',
];

function getPrecision(value: string): number {
  const afterDecimal = value.split('.')[1];
  return afterDecimal ? afterDecimal.length : 0;
}

class RangeInputElement extends HTMLElement {
  private _input: HTMLInputElement;
  private _valueDisplay?: HTMLSpanElement;
  private _ignoreChange = false;

  static get observedAttributes() {
    return REFLECTED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._input = document.createElement('input');
    this._input.type = 'range';
    this._input.className = style.input;

    let activePointer: number | undefined;

    // Not using pointer-tracker here due to https://bugs.webkit.org/show_bug.cgi?id=219636.
    this.addEventListener('pointerdown', (event) => {
      if (activePointer) return;
      activePointer = event.pointerId;
      this._input.classList.add(style.touchActive);
      const pointerUp = (event: PointerEvent) => {
        if (event.pointerId !== activePointer) return;
        activePointer = undefined;
        this._input.classList.remove(style.touchActive);
        window.removeEventListener('pointerup', pointerUp);
        window.removeEventListener('pointercancel', pointerUp);
      };
      window.addEventListener('pointerup', pointerUp);
      window.addEventListener('pointercancel', pointerUp);
    });

    for (const event of RETARGETED_EVENTS) {
      this._input.addEventListener(event, this._retargetEvent, true);
    }

    for (const event of UPDATE_EVENTS) {
      this._input.addEventListener(event, this._update, true);
    }
  }

  connectedCallback() {
    if (this.contains(this._input)) return;
    this.innerHTML =
      `<div class="${style.thumbWrapper}">` +
      `<div class="${style.thumb}"></div>` +
      `<div class="${style.valueDisplay}"><svg width="32" height="62"><path d="M27.3 27.3C25 29.6 17 35.8 17 43v3c0 3 2.5 5 3.2 5.8a6 6 0 1 1-8.5 0C12.6 51 15 49 15 46v-3c0-7.2-8-13.4-10.3-15.7A16 16 0 0 1 16 0a16 16 0 0 1 11.3 27.3z"/></svg><span></span></div>` +
      '</div>';

    this.insertBefore(this._input, this.firstChild);
    this._valueDisplay = this.querySelector(
      '.' + style.valueDisplay + ' > span',
    ) as HTMLSpanElement;
    // Set inline styles (this is useful when used with frameworks which might clear inline styles)
    this._update();
  }

  get labelPrecision(): string {
    return this.getAttribute('label-precision') || '';
  }

  set labelPrecision(precision: string) {
    this.setAttribute('label-precision', precision);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string | null,
  ) {
    if (this._ignoreChange) return;
    if (newValue === null) {
      this._input.removeAttribute(name);
    } else {
      this._input.setAttribute(name, newValue);
    }
    this._reflectAttributes();
    this._update();
  }

  private _retargetEvent = (event: Event) => {
    event.stopImmediatePropagation();
    const retargetted = new Event(event.type, event);
    this.dispatchEvent(retargetted);
  };

  private _getDisplayValue(value: number): string {
    if (value >= 10000) return (value / 1000).toFixed(1) + 'k';

    const labelPrecision =
      Number(this.labelPrecision) || getPrecision(this.step) || 0;
    return labelPrecision
      ? value.toFixed(labelPrecision)
      : Math.round(value).toString();
  }

  private _update = () => {
    // Not connected?
    if (!this._valueDisplay) return;
    const value = Number(this.value) || 0;
    const min = Number(this.min) || 0;
    const max = Number(this.max) || 100;
    const percent = (100 * (value - min)) / (max - min);
    const displayValue = this._getDisplayValue(value);

    this._valueDisplay!.textContent = displayValue;
    this.style.setProperty('--value-percent', percent + '%');
    this.style.setProperty('--value-width', '' + displayValue.length);
  };

  private _reflectAttributes() {
    this._ignoreChange = true;
    for (const attributeName of REFLECTED_ATTRIBUTES) {
      if (this._input.hasAttribute(attributeName)) {
        this.setAttribute(
          attributeName,
          this._input.getAttribute(attributeName)!,
        );
      } else {
        this.removeAttribute(attributeName);
      }
    }
    this._ignoreChange = false;
  }
}

interface RangeInputElement {
  name: string;
  min: string;
  max: string;
  step: string;
  value: string;
  disabled: boolean;
}

for (const prop of REFLECTED_PROPERTIES) {
  Object.defineProperty(RangeInputElement.prototype, prop, {
    get() {
      return this._input[prop];
    },
    set(val) {
      this._input[prop] = val;
      this._reflectAttributes();
      this._update();
    },
  });
}

export default RangeInputElement;

customElements.define('range-input', RangeInputElement);
