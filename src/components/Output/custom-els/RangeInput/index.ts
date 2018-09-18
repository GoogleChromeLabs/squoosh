import { bind } from '../../../../lib/util';
import './styles.css';

const RETARGETED_EVENTS = [
  'input',
  'change',
  'focus',
  'blur',
];

type REFLECTED_PROPERTIES = 'name' | 'min' | 'max' | 'step' | 'value' | 'disabled';

const REFLECTED_ATTRIBUTES = ['name', 'min', 'max', 'step', 'disabled'];

const OBSERVED_ATTRIBUTES : ({ [key: string]: string; }) = {
  name: 'name',
  min: 'min',
  max: 'max',
  step: 'step',
  value: 'value',
  disabled: 'disabled',
  labelPrecision: 'label-precision',
};

class RangeInputElement extends HTMLElement {
  private _input = document.createElement('input');
  private _valueDisplayWrapper = document.createElement('div');
  private _valueDisplay = document.createElement('span');
  private _fireChange = true;

  static get observedAttributes() {
    return Object.values(OBSERVED_ATTRIBUTES);
  }

  constructor() {
    super();
    this._input.type = 'range';

    for (const event of RETARGETED_EVENTS) {
      this._input.addEventListener(event, this._handleEvent, true);
    }
  }

  private _reflect(property: REFLECTED_PROPERTIES, value: any) {
    this._input[property] = value;
    const attributeValue = this._input.getAttribute(property);
    if (this.getAttribute(property) !== attributeValue) {
      this._fireChange = false;
      if (attributeValue === null) this.removeAttribute(property);
      else this.setAttribute(property, attributeValue);
      this._fireChange = true;
    }
    this._update();
  }

  get name() { return this._input.name; }
  set name(value) { this._reflect('name', value); }

  get min() { return this._input.min; }
  set min(value) { this._reflect('min', value); }

  get max() { return this._input.max; }
  set max(value) { this._reflect('max', value); }

  get step() { return this._input.step; }
  set step(value) { this._reflect('step', value); }

  get value() { return this._input.value; }
  set value(value) { this._reflect('value', value); }

  get disabled() { return this._input.disabled; }
  set disabled(value) { this._reflect('disabled', value); }

  get labelPrecision() {
    const precision = this.getAttribute('label-precision');
    return precision ? (parseInt(precision, 10) || 0) : undefined;
  }
  set labelPrecision(precision: string | number | null | undefined) {
    const coercedPrecision = precision == null ? '' : '' + precision;
    this.setAttribute('label-precision', coercedPrecision);
  }

  connectedCallback() {
    if (this._input.parentNode !== this) {
      this.appendChild(this._input);
      this._valueDisplayWrapper.appendChild(this._valueDisplay);
      this.appendChild(this._valueDisplayWrapper);
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this._fireChange === false) return;
    if (name === 'label-precision') {
      this.labelPrecision = newValue;
    } else if (name === 'value') {
      this.value = newValue;
    } else {
      for (const propertyName in OBSERVED_ATTRIBUTES) {
        if (OBSERVED_ATTRIBUTES[propertyName] === name) {
          if (this[propertyName as REFLECTED_PROPERTIES] !== newValue) {
            this._input.setAttribute(name, newValue);
            this._update();
          }
          return;
        }
      }
    }
  }

  @bind
  private _handleEvent(event: Event) {
    this._update();
    event.stopImmediatePropagation();
    const retargetted = new Event(event.type, event);
    this.dispatchEvent(retargetted);
  }

  @bind
  private _update() {
    this._reflectAttributes();
    const value = parseFloat(this.value || '0');
    const min = parseFloat(this._input.min || '0');
    const max = parseFloat(this._input.max || '100');
    const percent = 100 * (value - min) / (max - min);
    this.style.setProperty('--value-percent', percent + '%');
    const labelPrecision = this.labelPrecision;
    let displayValue = '' + value;
    if (labelPrecision === 0) {
      displayValue = '' + Math.round(parseFloat('' + displayValue));
    } else if (labelPrecision != null) {
      displayValue = parseFloat('' + displayValue).toPrecision(this.labelPrecision as number | 0);
    }
    this._valueDisplay.textContent = displayValue;
  }

  private _reflectAttributes() {
    for (const attributeName in REFLECTED_ATTRIBUTES) {
      const attributeValue = this._input.getAttribute(attributeName);
      if (this.getAttribute(attributeName) !== attributeValue) {
        this.setAttribute(attributeName, attributeValue || '');
      }
    }
  }
}

export default RangeInputElement;

customElements.define('range-input', RangeInputElement);
