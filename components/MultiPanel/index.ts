import './styles.css';

/**
 * A multi-panel view that the user can add any number of 'panels'. 
 * 'a panel' consists of two elements. even index element begomes heading, 
 * and odd index element becomes the expandable content.
 */
export default class MultiPanel extends HTMLElement {

  constructor () {
    super();
    
    // add EventListners
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);

    // Watch for children changes.
    new MutationObserver(() => this._childrenChange())
      .observe(this, { childList: true });
  }

  connectedCallback () {
    this._childrenChange();
  }
  
  // Click event handler
  _onClick(event:Event) {
    const el: Element = event.target;
    this._expand(this._getClosestHeading(el));
  }

  // KeyDown event handler
  _onKeyDown(event) {
    const selectedEl : Element = event.target;
    
    // if keydown event is not on heading element, ignore
    if (!this._getClosestHeading(selectedEl)) {
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
        this._expand(this._getClosestHeading(document.activeElement));
        break;

      // Any other key press is ignored and passed back to the browser.
      default:
        return;
    }

    event.preventDefault();
    selectedEl.setAttribute('tabindex', '-1');
    if (newHeading) {
      newHeading.setAttribute('tabindex', '0');
      newHeading.focus();
    }
  }

  _expand (heading : Element) {

    if (heading === undefined) {
      return;
    }

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
    console.log('hihihihihi')
    if (this.children.length % 2 !== 0) {
      console.error('detected odd number of elements inside multi-panel, please make sure you have heading/content pair')
    }

    const children : Element[] = Array.from(this.children);
    let tabindexAlreadySet : boolean = false;
    let randomId : string;

    children.forEach((child, i) => {
      if(i % 2 === 0){
        // even index = heading element

        // if panel-heading class is already assigned to the element (= new child was added later),
        // skip the ID/tabindex setting activities & just flag tabindexAlreadySet
        if (!child.classList.contains('panel-heading')){
          // for A11y
          randomId = Math.random().toString(36).substr(2, 9);
          child.classList.add('panel-heading');
          child.setAttribute('tabindex', '-1');
          child.id = `panel-heading-${randomId}`;
          child.setAttribute('aria-controls', `panel-content-${randomId}`);
        }  else {
          tabindexAlreadySet = true
        }       
      } else {
        // odd index = content element
        // if panel-content class is already assigned to the element (= new child was added later), skip
        if (!child.classList.contains('panel-content')){
          // for A11y
          child.classList.add('panel-content');
          child.id = `panel-content-${randomId}`;
          child.setAttribute('aria-labelledby', `panel-heading-${randomId}`);
        }
      } 
    })

    // Only if tab index was never set (= initial load) make the first heading focusable.
    // otherwise keep tab index where already is assigned.
    if(!tabindexAlreadySet) {
      children[0].setAttribute('tabindex', '0');
    }
  }

  _getClosestHeading (el : Element) {
    const closestEl = el.closest('multi-panel > *')
    if (closestEl.classList.contains('panel-heading')) {
      return closestEl
    }
    return undefined
  }

  // returns headding that is before currently selected one.
  _prevHeading () {
    // activeElement would be the currently selected headding
    // 2 elemements before that would be the previouse heading unless it is the first element.
    if (this.firstElementChild === document.activeElement) {
      return this.firstElementChild
    }
    return document.activeElement.previousElementSibling.previousElementSibling;
  }

  // returns headding that is after currently selected one.
  _nextHeading () {
    // activeElement would be the currently selected headding
    // 2 elemements after that would be the next heading.
    return document.activeElement.nextElementSibling.nextElementSibling;
  }

  // returns first heading in multi-panel.
  _firstHeading () {
    // first element is always first headding
    return this.firstElementChild;
  } 

  // returns last heading in multi-panel.
  _lastHeading () {
    // if the last element is headding, return last element
    const lastEl = this.lastElementChild;
    if (lastEl.classList.contains('panel-heading')) {
      return lastEl;
    }
    // otherwise return 2nd from the last
    return this.lastElementChild.previousElementSibling;
  }
}

customElements.define('multi-panel', MultiPanel); 