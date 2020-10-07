import * as style from './styles.css';
import 'add-css:./styles.css';
import { transitionHeight } from 'client/lazy-app/util';

interface CloseAllOptions {
  exceptFirst?: boolean;
}

const openOneOnlyAttr = 'open-one-only';

function getClosestHeading(el: Element): HTMLElement | undefined {
  // Look for the child of multi-panel, but stop at interactive elements like links & buttons
  const closestEl = el.closest('multi-panel > *, a, button');
  if (closestEl && closestEl.classList.contains(style.panelHeading)) {
    return closestEl as HTMLElement;
  }
  return undefined;
}

async function close(heading: HTMLElement) {
  const content = heading.nextElementSibling as HTMLElement;

  // if there is no content, nothing to expand
  if (!content) return;

  const from = content.getBoundingClientRect().height;

  heading.removeAttribute('content-expanded');
  content.setAttribute('aria-expanded', 'false');

  // Wait a microtask so other calls to open/close can get the final sizes.
  await null;

  await transitionHeight(content, {
    from,
    to: 0,
    duration: 300,
  });

  content.style.height = '';
}

async function open(heading: HTMLElement) {
  const content = heading.nextElementSibling as HTMLElement;

  // if there is no content, nothing to expand
  if (!content) return;

  const from = content.getBoundingClientRect().height;

  heading.setAttribute('content-expanded', '');
  content.setAttribute('aria-expanded', 'true');

  const to = content.getBoundingClientRect().height;

  // Wait a microtask so other calls to open/close can get the final sizes.
  await null;

  await transitionHeight(content, {
    from,
    to,
    duration: 300,
  });

  content.style.height = '';
}

/**
 * A multi-panel view that the user can add any number of 'panels'.
 * 'a panel' consists of two elements. Even index element becomes heading,
 * and odd index element becomes the expandable content.
 */
export default class MultiPanel extends HTMLElement {
  static get observedAttributes() {
    return [openOneOnlyAttr];
  }

  constructor() {
    super();

    // add EventListeners
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);

    // Watch for children changes.
    new MutationObserver(() => this._childrenChange()).observe(this, {
      childList: true,
    });
  }

  connectedCallback() {
    this._childrenChange();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === openOneOnlyAttr && newValue === null) {
      this._closeAll({ exceptFirst: true });
    }
  }

  // Click event handler
  private _onClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    const heading = getClosestHeading(el);
    if (!heading) return;
    this._toggle(heading);
  }

  // KeyDown event handler
  private _onKeyDown(event: KeyboardEvent) {
    const selectedEl = document.activeElement!;
    const heading = getClosestHeading(selectedEl);

    // if keydown event is not on heading element, ignore
    if (!heading) return;

    // if something inside of heading has focus, ignore
    if (selectedEl !== heading) return;

    // don’t handle modifier shortcuts used by assistive technology.
    if (event.altKey) return;

    let newHeading: HTMLElement | undefined;

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

      // this has 3 cases listed to support IEs and FF before 37
      case 'Enter':
      case ' ':
      case 'Spacebar':
        this._toggle(heading);
        break;

      // Any other key press is ignored and passed back to the browser.
      default:
        return;
    }

    event.preventDefault();
    if (newHeading) {
      selectedEl.setAttribute('tabindex', '-1');
      newHeading.setAttribute('tabindex', '0');
      newHeading.focus();
    }
  }

  private _toggle(heading: HTMLElement) {
    if (!heading) return;

    // toggle expanded and aria-expanded attributes
    if (heading.hasAttribute('content-expanded')) {
      close(heading);
    } else {
      if (this.openOneOnly) this._closeAll();
      open(heading);
    }
  }

  private _closeAll(options: CloseAllOptions = {}): void {
    const { exceptFirst = false } = options;
    let els = [...this.children].filter((el) =>
      el.matches('[content-expanded]'),
    ) as HTMLElement[];

    if (exceptFirst) {
      els = els.slice(1);
    }

    for (const el of els) close(el);
  }

  // children of multi-panel should always be even number (heading/content pair)
  private _childrenChange() {
    let preserveTabIndex = false;
    let heading = this.firstElementChild;

    while (heading) {
      const content = heading.nextElementSibling;
      const randomId = Math.random().toString(36).substr(2, 9);

      // if at the end of this loop, runout of element for content,
      // it means it has odd number of elements. log error and set heading to end the loop.
      if (!content) {
        console.error(
          '<multi-panel> requires an even number of element children.',
        );
        break;
      }

      // When odd number of elements were inserted in the middle,
      // what was heading before may become content after the insertion.
      // Remove classes and attributes to prepare for this change.
      heading.classList.remove(style.panelContent);
      content.classList.remove(style.panelHeading);
      heading.removeAttribute('aria-expanded');
      heading.removeAttribute('content-expanded');

      // If appreciable, remove tabindex from content which used to be header.
      content.removeAttribute('tabindex');

      // Assign heading and content classes
      heading.classList.add(style.panelHeading);
      content.classList.add(style.panelContent);

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

      // It's possible that the heading & content expanded attributes are now out of sync. Resync
      // them using the heading as the source of truth.
      content.setAttribute(
        'aria-expanded',
        heading.hasAttribute('content-expanded') ? 'true' : 'false',
      );

      // next sibling of content = next heading
      heading = content.nextElementSibling;
    }

    // if no flag, make 1st heading as tabindex 0 (otherwise keep previous tab index position).
    if (!preserveTabIndex && this.firstElementChild) {
      this.firstElementChild.setAttribute('tabindex', '0');
    }

    // In case we're openOneOnly, and an additional open item has been added:
    if (this.openOneOnly) this._closeAll({ exceptFirst: true });
  }

  // returns heading that is before currently selected one.
  private _prevHeading() {
    // activeElement would be the currently selected heading
    // 2 elements before that would be the previous heading unless it is the first element.
    if (this.firstElementChild === document.activeElement) {
      return this.firstElementChild as HTMLElement;
    }
    // previous Element of active Element is previous Content,
    // previous Element of previous Content is previousHeading
    const previousContent = document.activeElement!.previousElementSibling;
    if (previousContent) {
      return previousContent.previousElementSibling as HTMLElement;
    }
  }

  // returns heading that is after currently selected one.
  private _nextHeading() {
    // activeElement would be the currently selected heading
    // 2 elemements after that would be the next heading.
    const nextContent = document.activeElement!.nextElementSibling;
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
    if (lastEl && lastEl.classList.contains(style.panelHeading)) {
      return lastEl;
    }
    // otherwise return 2nd from the last
    const lastContent = this.lastElementChild;
    if (lastContent) {
      return lastContent.previousElementSibling as HTMLElement;
    }
  }

  /**
   * If true, only one panel can be open at once. When one opens, others close.
   */
  get openOneOnly() {
    return this.hasAttribute(openOneOnlyAttr);
  }

  set openOneOnly(val: boolean) {
    if (val) {
      this.setAttribute(openOneOnlyAttr, '');
    } else {
      this.removeAttribute(openOneOnlyAttr);
    }
  }
}

customElements.define('multi-panel', MultiPanel);
