import '@webcomponents/custom-elements';
import '../index';
import PinchZoom from '../index';
import './style.css';
import carImgSrc from './car.svg';

document.body.innerHTML = `
  <div class="side-by-side">
    <pinch-zoom class="left">
      <div>
        <div class="container">
          <h1>Hello world</h1>
          <button>Test</button>
          <img src="${carImgSrc}">
        </div>
      </div>
    </pinch-zoom>
    <pinch-zoom class="right">
      <div>
        <div class="container container-right">
          <h1>Foo bar</h1>
          <button>Test</button>
          <img src="${carImgSrc}">
        </div>
      </div>
    </pinch-zoom>
  </div>
`;

const pinchZooms = Array.from(document.querySelectorAll('pinch-zoom')) as [PinchZoom, PinchZoom];
const sideBySide = document.querySelector('.side-by-side') as HTMLDivElement;

if (!sideBySide) throw Error(`Can't find element`);

sideBySide.addEventListener('change', event => {
  const thisPinchZoom = event.target as PinchZoom;
  const otherPinchZoom = pinchZooms.find(p => p !== thisPinchZoom) as PinchZoom;

  otherPinchZoom.setTransform(thisPinchZoom.scale, thisPinchZoom.x, thisPinchZoom.y);
});

const retargetedEvents = new WeakSet();

for (const eventType of ['pointerdown', 'touchstart', 'touchend', 'touchmove', 'mousedown']) {
  sideBySide.addEventListener(eventType, event => {
    if (retargetedEvents.has(event)) return;
    event.stopImmediatePropagation();
    const clonedEvent = new event.constructor(event.type, event);
    event.preventDefault();
    retargetedEvents.add(clonedEvent);
    pinchZooms[0].dispatchEvent(clonedEvent);
  }, { capture: true });
}
