import * as style from '../style.css';
import { startBlobs, blobColor } from './meta';

/**
 * Control point x,y - point x,y - control point x,y
 */
export type BlobPoint = [number, number, number, number, number, number];

const maxRandomDistance = 0.25;

function randomisePoint(point: BlobPoint): BlobPoint {
  const distance = Math.random() * maxRandomDistance;
  const angle = Math.random() * Math.PI * 2;
  const xShift = Math.sin(angle) * distance;
  const yShift = Math.cos(angle) * distance;
  return [
    point[0] + xShift,
    point[1] + yShift,
    point[2] + xShift,
    point[3] + yShift,
    point[4] + xShift,
    point[5] + yShift,
  ];
}

function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

const randomDuration = () => Math.random() * 5000 + 4000;

interface CircleBlobPointState {
  basePoint: BlobPoint;
  pos: number;
  duration: number;
  startPoint: BlobPoint;
  endPoint: BlobPoint;
}

/** Bezier points for a seven point circle, to 3 decimal places */
const sevenPointCircle: BlobPoint[] = [
  [-0.304, -1, 0, -1, 0.304, -1],
  [0.592, -0.861, 0.782, -0.623, 0.972, -0.386],
  [1.043, -0.074, 0.975, 0.223, 0.907, 0.519],
  [0.708, 0.769, 0.434, 0.901, 0.16, 1.033],
  [-0.16, 1.033, -0.434, 0.901, -0.708, 0.769],
  [-0.907, 0.519, -0.975, 0.223, -1.043, -0.074],
  [-0.972, -0.386, -0.782, -0.623, -0.592, -0.861],
];

/*
// Should it be needed, here's how the above was created:
function createBezierCirclePoints(points: number): BlobPoint[] {
  const anglePerPoint = 360 / points;
  const matrix = new DOMMatrix();
  const point = new DOMPoint();
  const controlDistance = (4 / 3) * Math.tan(Math.PI / (2 * points));
  return Array.from({ length: points }, (_, i) => {
    point.x = -controlDistance;
    point.y = -1;
    const cp1 = point.matrixTransform(matrix);
    point.x = 0;
    point.y = -1;
    const p = point.matrixTransform(matrix);
    point.x = controlDistance;
    point.y = -1;
    const cp2 = point.matrixTransform(matrix);
    const basePoint: BlobPoint = [cp1.x, cp1.y, p.x, p.y, cp2.x, cp2.y];
    matrix.rotateSelf(0, 0, anglePerPoint);
    return basePoint;
  });
}
*/

class CircleBlob {
  private animStates: CircleBlobPointState[] = [];

  constructor(
    basePoints: BlobPoint[],
    startPoints: BlobPoint[] = basePoints.map((point) => randomisePoint(point)),
  ) {
    this.animStates = basePoints.map((basePoint, i) => ({
      basePoint,
      pos: 0,
      duration: randomDuration(),
      startPoint: startPoints[i],
      endPoint: randomisePoint(basePoint),
    }));
  }

  frame(timeDelta: number): BlobPoint[] {
    return this.animStates.map((animState) => {
      animState.pos += timeDelta / animState.duration;
      if (animState.pos >= 1) {
        animState.startPoint = animState.endPoint;
        animState.pos = 0;
        animState.duration = randomDuration();
        animState.endPoint = randomisePoint(animState.basePoint);
      }
      const eased = easeInOutQuad(animState.pos);

      const point = animState.startPoint.map((startPoint, i) => {
        const endPoint = animState.endPoint[i];
        return (endPoint - startPoint) * eased + startPoint;
      }) as BlobPoint;

      return point;
    });
  }
}

const rotationTime = 120000;

class CentralBlobs {
  private rotatePos: number = 0;
  private blobs = Array.from(
    { length: 4 },
    (_, i) => new CircleBlob(sevenPointCircle, startBlobs[i]),
  );

  constructor() {
    console.log(
      `WARNING: There's a debug key listener here that must be removed before going live`,
    );
    addEventListener('keyup', (event) => {
      if (event.key !== 'b') return;
      console.log(
        JSON.stringify(
          this.blobs.map((blob) =>
            blob
              .frame(0)
              .map((points) => points.map((point) => Number(point.toFixed(3)))),
          ),
        ),
      );
    });
  }

  draw(
    ctx: CanvasRenderingContext2D,
    timeDelta: number,
    x: number,
    y: number,
    radius: number,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius, radius);
    this.rotatePos = (this.rotatePos + timeDelta / rotationTime) % 1;
    ctx.rotate(Math.PI * 2 * this.rotatePos);

    for (const blob of this.blobs) {
      const points = blob.frame(timeDelta);
      ctx.beginPath();
      ctx.moveTo(points[0][2], points[0][3]);

      for (let i = 0; i < points.length; i++) {
        const nextI = i === points.length - 1 ? 0 : i + 1;
        ctx.bezierCurveTo(
          points[i][4],
          points[i][5],
          points[nextI][0],
          points[nextI][1],
          points[nextI][2],
          points[nextI][3],
        );
      }

      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

const deltaMultiplierStep = 0.01;

export function startBlobAnim(canvas: HTMLCanvasElement) {
  let lastTime: number;
  const ctx = canvas.getContext('2d')!;
  const centralBlobs = new CentralBlobs();
  const loadImgEl = document.querySelector('.' + style.loadImg)!;
  let deltaMultiplier = 1;
  let hasFocus = true;
  let animating = true;

  const focusListener = () => {
    hasFocus = true;
    if (!animating) startAnim();
  };
  const blurListener = () => {
    hasFocus = false;
  };

  addEventListener('focus', focusListener);
  addEventListener('blur', blurListener);

  function destruct() {
    removeEventListener('focus', focusListener);
    removeEventListener('blur', blurListener);
  }

  function frame(time: number) {
    // Stop the loop if the canvas is gone
    if (!canvas.isConnected) {
      destruct();
      return;
    }

    // Be kind: If the window isn't focused, bring the animation to a stop.
    if (!hasFocus) {
      // Bring the anim to a slow stop
      deltaMultiplier = Math.max(0, deltaMultiplier - deltaMultiplierStep);
      if (deltaMultiplier === 0) {
        animating = false;
        return;
      }
    } else if (deltaMultiplier !== 1) {
      deltaMultiplier = Math.min(1, deltaMultiplier + deltaMultiplierStep);
    }

    const delta = (time - lastTime) * deltaMultiplier;
    lastTime = time;

    const canvasBounds = canvas.getBoundingClientRect();
    canvas.width = canvasBounds.width * devicePixelRatio;
    canvas.height = canvasBounds.height * devicePixelRatio;
    const loadImgBounds = loadImgEl.getBoundingClientRect();

    ctx.fillStyle = blobColor;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    centralBlobs.draw(
      ctx,
      delta,
      loadImgBounds.left - canvasBounds.left + loadImgBounds.width / 2,
      loadImgBounds.top - canvasBounds.top + loadImgBounds.height / 2,
      loadImgBounds.height / 2 / (1 + maxRandomDistance),
    );

    requestAnimationFrame(frame);
  }

  function startAnim() {
    animating = true;
    requestAnimationFrame((time: number) => {
      lastTime = time;
      frame(time);
    });
  }

  startAnim();
}
