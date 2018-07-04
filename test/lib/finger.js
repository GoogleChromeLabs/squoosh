let touchPoints = [];
let idCnt = 0;

class Finger {
  constructor (point, page) {
    this._point = point;
    this._page = page;
  }

  move (x, y) {
    if (!this._point) return;
    Object.assign(this._point, {
      x: Math.floor(x),
      y: Math.floor(y)
    });
    this._page.touchscreen._client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints,
      modifiers: this._page._keyboard._modifiers
    });
  }

  up () {
    if (!this._point) return;
    const idx = touchPoints.indexOf(this._point);
    touchPoints = touchPoints.splice(idx, 1);
    this._point = null;
    if (touchPoints.length === 0) {
      this._page.touchscreen._client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        modifiers: this._page._keyboard._modifiers
      });
    } else {
      this._page.touchscreen._client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints,
        modifiers: this._page._keyboard._modifiers
      });
    }
  }
}

function fingerDown (page, x, y) {
  const id = idCnt++;
  const point = {
    x: Math.round(x),
    y: Math.round(y),
    id
  };
  touchPoints.push(point);
  page.touchscreen._client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints,
    modifiers: page._keyboard._modifiers
  });
  return new Finger(point, page);
}

module.exports = {
  fingerDown
};
