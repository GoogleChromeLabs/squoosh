import '@webcomponents/custom-elements';
import PinchZoom from '../PinchZoom/index';
import '../PinchZoom/index';
import './style.css';
import carImgSrc from './car.svg';
import TwoUp from '../TwoUp/index';
import '../TwoUp/index';
import '../MultiPanel/index';

document.body.innerHTML = `
  <h1>Multi panel</h1>
  <multi-panel>TODO</multi-panel>
  <h1>Side by side</h1>
  <two-up legacy-clip-compat>
    <pinch-zoom>
      <div>
        <div class="container">
          <h1>Hello world</h1>
          <button>Test</button>
          <img src="${carImgSrc}">
        </div>
      </div>
    </pinch-zoom>
    <pinch-zoom>
      <div>
        <div class="container container-right">
          <h1>Foo bar</h1>
          <button>Test</button>
          <img src="${carImgSrc}">
        </div>
      </div>
    </pinch-zoom>
  </two-up>
  <h1>Single</h1>
  <pinch-zoom>
    <div>
      <div class="container">
        <h1>Hello world</h1>
        <button>Test</button>
        <img src="${carImgSrc}">
      </div>
    </div>
  </pinch-zoom>
`;

const twoUp = document.querySelector('two-up') as TwoUp;
const pinchZooms = Array.from(twoUp.querySelectorAll('pinch-zoom')) as [PinchZoom, PinchZoom];

twoUp.addEventListener('change', event => {
  const thisPinchZoom = event.target as PinchZoom;
  const otherPinchZoom = pinchZooms.find(p => p !== thisPinchZoom) as PinchZoom;

  otherPinchZoom.setTransform({
    scale: thisPinchZoom.scale,
    x: thisPinchZoom.x,
    y: thisPinchZoom.y
  });
});

const retargetedEvents = new WeakSet();

for (const eventType of ['pointerdown', 'touchstart', 'touchend', 'touchmove', 'mousedown']) {
  twoUp.addEventListener(eventType, event => {
    const targetEl = event.target as HTMLElement;
    if (targetEl.closest('.two-up-handle')) return;
    if (retargetedEvents.has(event)) return;
    event.stopImmediatePropagation();
    const clonedEvent = new (event.constructor as any)(event.type, event);
    event.preventDefault();
    retargetedEvents.add(clonedEvent);
    pinchZooms[0].dispatchEvent(clonedEvent);
  }, { capture: true });
}
