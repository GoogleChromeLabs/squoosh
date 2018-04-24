import './styles.css';

/**
 * A multi-panel view that the user can add any number of 'panels'. 
 * 'a panel' consists of two elements. even index element begomes heading, 
 * and odd index element becomes the expandable content.
 */
export default class MultiPanel extends HTMLElement {

  constructor () {
    super();

    // Watch for children changes.
    new MutationObserver(() => this._childrenChange())
      .observe(this, { childList: true });
  }

  connectedCallback () {
    this._childrenChange();

    const children : Element[] = Array.from(this.children);
    for (let i : number = 0; i < children.length; i++){
      const child : Element = children[i]

      if(i % 2 === 0){  
        // even index = heading element
        child.classList.add('panel-heading');
        
        // for A11y
        child.id = `panel-heading-${i}`;
        child.setAttribute('tabindex', '-1');
        child.setAttribute('aria-controls', `panel-content-${i}`);
      } else {
        // odd index = content element
        child.classList.add('panel-content');

        // for A11y
        child.id = `panel-content-${i-1}`;
        child.setAttribute('aria-labelledby', `panel-heading-${i-1}`);
      } 
    }

    // make the first heading focusable.
    children[0].setAttribute('tabindex', '0');

    // add EventListners
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);
  }

  // remove EventListeners
  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeyDown);
  }
  
  // Click event handler
  _onClick(event) {
    const heading : Element = event.target;
    if (this._isHeading(heading)) {
      this._expand(heading);
    }
  }

  // KeyDown event handler
  _onKeyDown(event) {
    const currentHeading : Element = event.target;
    
    // if clicke event is not on heading element, ignore
    if (!this._isHeading(currentHeading)) {
      return;
    }

    // don’t handle modifier shortcuts used by assistive technology.    
    if (event.altKey) {
      return;
    }
    let newHeading;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        newHeading = this._prevHeading();
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        newHeading = this._nextHeading();
        break;

      case 'Home':
        newHeading = this._firstHeading();
        break;

      case 'End':
        newHeading = this._lastHeading();
        break;

      case 'Enter':
      case ' ':
        if (this._isHeading(document.activeElement)) {
            this._expand(document.activeElement);
        }
        break;

      // Any other key press is ignored and passed back to the browser.
      default:
        return;
    }

    event.preventDefault();
    currentHeading.setAttribute('tabindex', '-1');
    if (newHeading) {
      newHeading.setAttribute('tabindex', '0');
      newHeading.focus();
    }
  }

  _expand (heading : Element) {
    const content = heading.nextElementSibling;
    
    // heading elment should always have nextElementSibling (checked on _childrenChange)
    // but in case it is null, return.
    if (content === null) {
      return;
    }

    // toggle expanded and aria-expanded attoributes
    if (content.hasAttribute('expanded')) {
      content.removeAttribute('expanded')
      content.setAttribute('aria-expanded', 'false');
    } else {
      content.setAttribute('expanded', '') 
      content.setAttribute('aria-expanded', 'true');  
    }
  }
  
  // children of multi-panel should always in even nuber (heading/content pair)
  // if children are odd numbers, add a div at the end to prevent potential error.
  _childrenChange () {
    if (this.children.length % 2 !== 0) {
      console.error('detected odd number of elements inside multi-panel, please make sure you have heading/content pair')
      this.appendChild(document.createElement('div'))
    }
  }

  // called to check if an element passed is panel heading
  _isHeading (heading : Element) {
    return heading.classList.contains('panel-heading');
  }

  // return list of panel heading elements
  _allHeadings () {
    return Array.from(this.querySelectorAll('.panel-heading'));
  }

  // returns headding that is before currently selected one.
  _prevHeading () {
    const headings : Element[] = this._allHeadings();
    let newIdx : number = headings.findIndex(headings => headings === document.activeElement) - 1;
    return headings[(newIdx + headings.length) % headings.length];
  }

  // returns headding that is after currently selected one.
  _nextHeading () {
    const headings : Element[] = this._allHeadings();
    let newIdx  : number = headings.findIndex(heading => heading === document.activeElement) + 1;
    return headings[newIdx % headings.length];
  }

  // returns first heading in multi-panel.
  _firstHeading () {
    const headings : Element[] = this._allHeadings();
    return headings[0];
  } 

  // returns last heading in multi-panel.
  _lastHeading () {
    const headings : Element[] = this._allHeadings();
    return headings[headings.length - 1];
  }   
}

customElements.define('multi-panel', MultiPanel); 