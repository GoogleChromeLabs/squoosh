import './styles.css';

export default class MultiPanel extends HTMLElement {
  constructor () {
    super();
  }

  connectedCallback () {
  }
}

customElements.define('multi-panel', MultiPanel);
