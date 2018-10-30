import PointerTracker from 'pointer-tracker';
import { bind } from '../../lib/initial-util';
import * as style from './styles.css';

const RETARGETED_EVENTS = ['focus', 'blur'];
const UPDATE_EVENTS = ['input', 'change'];
const REFLECTED_PROPERTIES = ['name', 'min', 'max', 'step', 'value', 'disabled'];
const REFLECTED_ATTRIBUTES = ['name', 'min', 'max', 'step', 'value', 'disabled'];

function getPrescision(value: string): number {
  const afterDecimal = value.split('.')[1];
  return afterDecimal ? afterDecimal.length : 0;
}

class RangeInputElement extends HTMLElement {
  private _input: HTMLInputElement;
  private _valueDisplay?: HTMLDivElement;
  private _ignoreChange = false;

  static get observedAttributes() {
    return REFLECTED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._input = document.createElement('input');
    this._input.type = 'range';
    this._input.className = style.input;

    const tracker = new PointerTracker(this._input, {
      start: (): boolean => {
        if (tracker.currentPointers.length !== 0) return false;
        this._input.classList.add(style.touchActive);
        return true;
      },
      end: () => {
        this._input.classList.remove(style.touchActive);
      },
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
        `<div class="${style.valueDisplay}"></div>` +
      '</div>';

    this.insertBefore(this._input, this.firstChild);
    this._valueDisplay = this.querySelector('.' + style.valueDisplay) as HTMLDivElement;
    // Set inline styles (this is useful when used with frameworks which might clear inline styles)
    this._update();
  }

  get labelPrecision(): string {
    return this.getAttribute('label-precision') || '';
  }

  set labelPrecision(precision: string) {
    this.setAttribute('label-precision', precision);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string | null) {
    if (this._ignoreChange) return;
    if (newValue === null) {
      this._input.removeAttribute(name);
    } else {
      this._input.setAttribute(name, newValue);
    }
    this._reflectAttributes();
    this._update();
  }

  @bind
  private _retargetEvent(event: Event) {
    event.stopImmediatePropagation();
    const retargetted = new Event(event.type, event);
    this.dispatchEvent(retargetted);
  }

  @bind
  private _update() {
    const value = Number(this.value) || 0;
    const min = Number(this.min) || 0;
    const max = Number(this.max) || 100;
    const labelPrecision = Number(this.labelPrecision) || getPrescision(this.step) || 0;
    const percent = 100 * (value - min) / (max - min);
    const displayValue = labelPrecision ? value.toFixed(labelPrecision) :
      Math.round(value).toString();

    this._valueDisplay!.textContent = displayValue;
    this.style.setProperty('--value-percent', percent + '%');
    this.style.setProperty('--value-width', '' + displayValue.length);
  }

  private _reflectAttributes() {
    this._ignoreChange = true;
    for (const attributeName of REFLECTED_ATTRIBUTES) {
      if (this._input.hasAttribute(attributeName)) {
        this.setAttribute(attributeName, this._input.getAttribute(attributeName)!);
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
