import './styles.css';

function getClosestHeading(el: Element) {
  const closestEl = el.closest('multi-panel > *');
  if (closestEl && closestEl.classList.contains('panel-heading')) {
    return closestEl;
  }
  return undefined;
}

/**
 * A multi-panel view that the user can add any number of 'panels'.
 * 'a panel' consists of two elements. Even index element becomes heading,
 * and odd index element becomes the expandable content.
 */
export default class MultiPanel extends HTMLElement {

  constructor() {
    super();

    // add EventListeners
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
  private _onClick(event: MouseEvent) {
    const el: Element = event.target as Element;
    const heading = getClosestHeading(el);
    if (!heading) return;
    this._expand(heading);
  }

  // KeyDown event handler
  private _onKeyDown(event: KeyboardEvent) {
    const selectedEl = document.activeElement;
    const heading = getClosestHeading(selectedEl);

    // if keydown event is not on heading element, ignore
    if (!heading) return;

    // don’t handle modifier shortcuts used by assistive technology.
    if (event.altKey) return;

    let newHeading:HTMLElement | undefined;
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
      case 'Spacebar':
        this._expand(heading);
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

  private _expand(heading: Element) {
    if (!heading) return;
    const content = heading.nextElementSibling;

    // if there is no content, nothing to expand
    if (!content) return;

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
  private _childrenChange() {
    let preserveTabIndex : boolean = false;
    let heading = this.firstElementChild;

    while (heading) {
      const content = heading.nextElementSibling;
      const randomId = Math.random().toString(36).substr(2, 9);

      // if at the end of this loop, runout of element for content,
      // it means it has odd number of elements. log error and set heading to end the loop.
      if (!content) {
        console.error('<multi-panel> requires an even number of element children.');
        heading = null;
        continue;
      }

      // When odd number of elements were inserted in the middle,
      // what was heading before may become content after the insertion.
      // Remove classes and attributes to prepare for this change.
      heading.classList.remove('panel-content');

      if (content.classList.contains('panel-heading')) {
        content.classList.remove('panel-heading');
      }
      if (heading.hasAttribute('expanded') && heading.hasAttribute('aria-expanded')) {
        heading.removeAttribute('expanded');
        heading.removeAttribute('aria-expanded');
      }

      // If appreciable, remove tabindex from content which used to be header.
      if (content.hasAttribute('tabindex')) {
        content.removeAttribute('tabindex');
      }

      // Assign heading and content classes
      heading.classList.add('panel-heading');
      content.classList.add('panel-content');

      // Assign ids and aria-X for heading/content pair.
      heading.id = `panel-heading-${randomId}`;
      heading.setAttribute('aria-controls', `panel-content-${randomId}`);
      content.id = `panel-content-${randomId}`;
      content.setAttribute('aria-labelledby', `panel-heading-${randomId}`);

      // If tabindex 0 is assigned to a heading, flag to preserve tab index position.
      // Otherwise, make sure tabindex -1 is set to heading elements.
      if (heading.getAttribute('tabindex') === '0') {
        preserveTabIndex = true;
      } else {
        heading.setAttribute('tabindex', '-1');
      }

      // next sibling of content = next heading
      heading = content.nextElementSibling;
    }

    // if no flag, make 1st heading as tabindex 0 (otherwise keep previous tab index position).
    if (!preserveTabIndex && this.firstElementChild) {
      this.firstElementChild.setAttribute('tabindex', '0');
    }
  }

  // returns heading that is before currently selected one.
  private _prevHeading() {
    // activeElement would be the currently selected heading
    // 2 elements before that would be the previous heading unless it is the first element.
    if (this.firstElementChild === document.activeElement) {
      return this.firstElementChild as HTMLElement;
    }
    // previous Element of active Element is previous Content,
    // previous Element of previous Content  is previousHeading
    const previousContent = document.activeElement.previousElementSibling;
    if (previousContent) {
      return previousContent.previousElementSibling as HTMLElement;
    }
  }

  // returns heading that is after currently selected one.
  private _nextHeading() {
    // activeElement would be the currently selected heading
    // 2 elemements after that would be the next heading.
    const nextContent = document.activeElement.nextElementSibling;
    if (nextContent) {
      return nextContent.nextElementSibling as HTMLElement;
    }
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
  }
}

customElements.define('multi-panel', MultiPanel);
