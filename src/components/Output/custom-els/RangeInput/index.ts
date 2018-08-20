import { bind } from '../../../../lib/util';
import './styles.css';

const RETARGETED_EVENTS = [
  'input',
  'change',
  'focus',
  'blur',
];

const REFLECTED_PROPERTIES = [
  'name',
  'value',
  'min',
  'max',
  'step',
];

interface RangeInputElement {
  value: string;
  min: string;
  max: string;
  step: string;
}

class RangeInputElement extends HTMLElement {
  private _input = document.createElement('input');
  private _valueDisplayWrapper = document.createElement('div');
  private _valueDisplay = document.createElement('span');
  private _precision = 0;

  constructor() {
    super();
    this._input.type = 'range';

    for (const event of RETARGETED_EVENTS) {
      this._input.addEventListener(event, this._handleEvent, true);
    }

    for (const property of REFLECTED_PROPERTIES) {
      Object.defineProperty(this, property, {
        configurable: true,
        get() {
          return this._input[property];
        },
        set(value) {
          this._input[property] = value;
          this._update();
        },
      });
    }
  }

  connectedCallback() {
    if (this._input.parentNode !== this) {
      this.appendChild(this._input);
      this._valueDisplayWrapper.appendChild(this._valueDisplay);
      this.appendChild(this._valueDisplayWrapper);
    }
  }

  set valueDisplayPrecision(precision: string) {
    this._precision = parseInt(precision, 10) || 0;
  }

  get valueDisplayPrecision() {
    return '' + this._precision;
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
    let displayValue = '' + value;
    if (this._precision) {
      displayValue = parseFloat(displayValue).toPrecision(this._precision);
    } else {
      displayValue = '' + Math.round(parseFloat(displayValue));
    }
    this._valueDisplay.textContent = '' + displayValue;
  }

  private _reflectAttributes() {
    for (const property of REFLECTED_PROPERTIES) {
      const attributeValue = this._input.getAttribute(property);
      if (this.getAttribute(property) !== attributeValue) {
        this.setAttribute(property, attributeValue || '');
      }
    }
  }
}

export default RangeInputElement;

customElements.define('range-input', RangeInputElement);
