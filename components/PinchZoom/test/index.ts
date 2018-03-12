import '@webcomponents/custom-elements';
import '../index';
import './style.css';
import carImgSrc from './car.svg';

document.body.innerHTML = `
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
