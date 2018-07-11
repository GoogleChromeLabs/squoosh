import './styles.css';

/**
 * A multi-panel view that the user can add any number of 'panels'.
 * 'a panel' consists of two elements. Even index element becomes heading,
 * and odd index element becomes the expandable content.
 */
export default class MultiPanel extends Element {

  constructor() {
    super();

    // add EventListners
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);

    // Watch for children changes.
    new MutationObserver(() => this._childrenChange())
      .observe(this, { childList: true });
  }

  connectedCallback() {
    this._childrenChange();
  }

  // Click event handler
  private _onClick(event: Event) {
    const el: Element = event.target as HTMLElement;
    this._expand(this._getClosestHeading(el) as HTMLElement);
  }

  // KeyDown event handler
  private _onKeyDown(event: Event) {
    const selectedEl = document.activeElement;
    const keyboardEvent = event as KeyboardEvent;
    const closestHeading = this._getClosestHeading(selectedEl)
    // if keydown event is not on heading element, ignore
    if (!closestHeading) {
      return;
    }

    // don’t handle modifier shortcuts used by assistive technology.
    if (keyboardEvent.altKey) {
      return;
    }
    let newHeading;
    switch (keyboardEvent.key) {
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
      case 'Spacebar':
        this._expand(closestHeading as HTMLElement);
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

  private _expand(heading: HTMLElement) {

    if (heading === undefined) {
      return;
    }

    const content = heading.nextElementSibling;

    // heading element should always have nextElementSibling (checked on _childrenChange)
    // but in case it is null, return.
    if (content === null) {
      return;
    }

    // toggle expanded and aria-expanded attributes
    if (content.hasAttribute('expanded')) {
      content.removeAttribute('expanded');
      content.setAttribute('aria-expanded', 'false');
    } else {
      content.setAttribute('expanded', '');
      content.setAttribute('aria-expanded', 'true');
    }
  }

  // children of multi-panel should always be even number (heading/content pair)
  // if children are odd numbers, add a div at the end to prevent potential error.
  private _childrenChange() {
    if (this.children.length % 2 !== 0) {
      console.error(`detected odd number of elements inside multi-panel,
      please make sure you have heading/content pair`);
    }

    const children : Element[] = Array.from(this.children);
    let tabindexAlreadySet : boolean = false;

    for (let i = 0; i < children.length; i += 2) {
      const heading = children[i];
      const content = children[i + 1];
      const randomId = Math.random().toString(36).substr(2, 9);

      // if panel-heading/panel-content class is already assigned to elements
      // (= new child was added earlier), skip the ID/tabindex setting activities
      // and just flag tabindexAlreadySet
      if (heading.classList.contains('panel-heading')
        && content.classList.contains('panel-content')) {
        tabindexAlreadySet = true;
        continue;
      }

      // for A11y add id and tab index
      heading.classList.add('panel-heading');
      heading.setAttribute('tabindex', '-1');
      heading.id = `panel-heading-${randomId}`;
      heading.setAttribute('aria-controls', `panel-content-${randomId}`);

      content.classList.add('panel-content');
      content.id = `panel-content-${randomId}`;
      content.setAttribute('aria-labelledby', `panel-heading-${randomId}`);
    }

    // Only if tab index was never set (= initial load) make the first heading focusable.
    // otherwise keep tab index where already is assigned.
    if (!tabindexAlreadySet) {
      children[0].setAttribute('tabindex', '0');
    }
  }

  private _getClosestHeading(el: Element) {
    const closestEl = el.closest('multi-panel > *');
    if (closestEl && closestEl.classList.contains('panel-heading')) {
      return closestEl as HTMLElement;
    }
    return undefined;
  }

  // returns heading that is before currently selected one.
  private _prevHeading() {
    // activeElement would be the currently selected heading
    // 2 elemements before that would be the previous heading unless it is the first element.
    if (this.firstElementChild === document.activeElement) {
      return this.firstElementChild as HTMLElement;
    }
    // previous Element of active Element is previous Content,
    // previous Element of previous Content  is previousHeading
    const previousContent = document.activeElement.previousElementSibling;
    if (previousContent) {
      return previousContent.previousElementSibling as HTMLElement;
    }
    return;
  }

  // returns heading that is after currently selected one.
  private _nextHeading() {
    // activeElement would be the currently selected heading
    // 2 elemements after that would be the next heading.
    const nextContent = document.activeElement.nextElementSibling;
    if (nextContent) {
      return nextContent.nextElementSibling as HTMLElement;
    }
    return;
  }

  // returns first heading in multi-panel.
  private _firstHeading() {
    // first element is always first heading
    return this.firstElementChild as HTMLElement;
  }

  // returns last heading in multi-panel.
  private _lastHeading() {
    // if the last element is heading, return last element
    const lastEl = this.lastElementChild as HTMLElement;
    if (lastEl && lastEl.classList.contains('panel-heading')) {
      return lastEl;
    }
    // otherwise return 2nd from the last
    const lastContent = this.lastElementChild;
    if (lastContent) {
      return lastContent.previousElementSibling as HTMLElement;
    }
    return;
  }
}

customElements.define('multi-panel', MultiPanel);
