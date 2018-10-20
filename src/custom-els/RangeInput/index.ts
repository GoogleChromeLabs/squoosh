import { bind } from '../../lib/initial-util';
import './styles.css';

const RETARGETED_EVENTS = ['focus', 'blur'];
const UPDATE_EVENTS = ['input', 'change'];
const REFLECTED_PROPERTIES = ['name', 'min', 'max', 'step', 'value', 'disabled'];
const REFLECTED_ATTRIBUTES = ['name', 'min', 'max', 'step', 'value', 'disabled'];

class RangeInputElement extends HTMLElement {
  private _input = document.createElement('input');
  private _valueDisplayWrapper = document.createElement('div');
  private _valueDisplay = document.createElement('span');
  private _ignoreChange = false;

  static get observedAttributes() {
    return REFLECTED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._input.type = 'range';

    for (const event of RETARGETED_EVENTS) {
      this._input.addEventListener(event, this._retargetEvent, true);
    }

    for (const event of UPDATE_EVENTS) {
      this._input.addEventListener(event, this._update, true);
    }
  }

  get labelPrecision(): string {
    return this.getAttribute('label-precision') || '';
  }

  set labelPrecision(precision: string) {
    this.setAttribute('label-precision', precision);
  }

  connectedCallback() {
    if (this._input.parentNode !== this) {
      this.appendChild(this._input);
      this._valueDisplayWrapper.appendChild(this._valueDisplay);
      this.appendChild(this._valueDisplayWrapper);
    }
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
    const value = parseFloat(this.value || '0');
    const min = parseFloat(this.min || '0');
    const max = parseFloat(this.max || '100');
    const labelPrecision = parseFloat(this.labelPrecision || '0');
    const percent = 100 * (value - min) / (max - min);
    const displayValue = labelPrecision ? value.toPrecision(labelPrecision) :
      Math.round(value).toString();

    this._valueDisplay.textContent = displayValue;
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
