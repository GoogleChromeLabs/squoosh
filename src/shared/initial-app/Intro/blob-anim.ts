import * as style from './style.css';

/**
 * Control point x,y - point x,y - control point x,y
 */
type BlobPoint = [number, number, number, number, number, number];

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

/** Start points, for the shape we use in prerender */
const startPoints: BlobPoint[][] = [
  [
    [-0.232, -1.029, 0.073, -1.029, 0.377, -1.029],
    [0.565, -1.098, 0.755, -0.86, 0.945, -0.622],
    [0.917, -0.01, 0.849, 0.286, 0.782, 0.583],
    [0.85, 0.687, 0.576, 0.819, 0.302, 0.951],
    [-0.198, 1.009, -0.472, 0.877, -0.746, 0.745],
    [-0.98, 0.513, -1.048, 0.216, -1.116, -0.08],
    [-0.964, -0.395, -0.774, -0.633, -0.584, -0.871],
  ],
  [
    [-0.505, -1.109, -0.201, -1.109, 0.104, -1.109],
    [0.641, -0.684, 0.831, -0.446, 1.02, -0.208],
    [1.041, 0.034, 0.973, 0.331, 0.905, 0.628],
    [0.734, 0.794, 0.46, 0.926, 0.186, 1.058],
    [-0.135, 0.809, -0.409, 0.677, -0.684, 0.545],
    [-0.935, 0.404, -1.002, 0.108, -1.07, -0.189],
    [-0.883, -0.402, -0.693, -0.64, -0.503, -0.878],
  ],
  [
    [-0.376, -1.168, -0.071, -1.168, 0.233, -1.168],
    [0.732, -0.956, 0.922, -0.718, 1.112, -0.48],
    [1.173, 0.027, 1.105, 0.324, 1.038, 0.621],
    [0.707, 0.81, 0.433, 0.943, 0.159, 1.075],
    [-0.096, 1.135, -0.37, 1.003, -0.644, 0.871],
    [-0.86, 0.457, -0.927, 0.161, -0.995, -0.136],
    [-0.87, -0.516, -0.68, -0.754, -0.49, -0.992],
  ],
  [
    [-0.309, -0.998, -0.004, -0.998, 0.3, -0.998],
    [0.535, -0.852, 0.725, -0.614, 0.915, -0.376],
    [1.05, -0.09, 0.982, 0.207, 0.915, 0.504],
    [0.659, 0.807, 0.385, 0.939, 0.111, 1.071],
    [-0.178, 1.048, -0.452, 0.916, -0.727, 0.784],
    [-0.942, 0.582, -1.009, 0.285, -1.077, -0.011],
    [-1.141, -0.335, -0.951, -0.573, -0.761, -0.811],
  ],
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
    (_, i) => new CircleBlob(sevenPointCircle, startPoints[i]),
  );

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
        console.log(centralBlobs);
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

    ctx.fillStyle = 'rgba(255, 0, 102, 0.3)';
    ctx.scale(devicePixelRatio, devicePixelRatio);

    centralBlobs.draw(
      ctx,
      delta,
      loadImgBounds.left - canvasBounds.left + loadImgBounds.width / 2,
      loadImgBounds.top - canvasBounds.top + loadImgBounds.height / 2,
      (loadImgBounds.width / 2) * (1 - maxRandomDistance),
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
