<!-- The two images, one on each side of a draggable split, panned and zoomed
     together. Plus the zoom, rotate and display buttons. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import {
  AddIcon,
  RemoveIcon,
  RotateIcon,
  ToggleAliasingActiveIcon,
  ToggleAliasingIcon,
  ToggleBackgroundActiveIcon,
  ToggleBackgroundIcon,
} from '@/components/icons';
import { usePanZoom, type ScaleToOpts } from '@/composables/usePanZoom';
import type { SourceImage } from '@/composables/useCompressor';
import { drawDataToCanvas } from '@/lib/canvas';
import { isSafari } from '@/lib/util';

const props = defineProps<{
  source?: SourceImage;
  vertical: boolean;
  leftCompressed?: ImageData;
  rightCompressed?: ImageData;
  leftImgContain: boolean;
  rightImgContain: boolean;
}>();

const emit = defineEmits<{ rotate: [] }>();

const scaleToOpts: ScaleToOpts = {
  originX: '50%',
  originY: '50%',
  relativeTo: 'container',
};

const container = useTemplateRef<HTMLElement>('container');
const canvasLeft = useTemplateRef<HTMLCanvasElement>('canvasLeft');
const canvasRight = useTemplateRef<HTMLCanvasElement>('canvasRight');
const scaleInput = useTemplateRef<HTMLInputElement>('scaleInput');

const panZoom = usePanZoom(container, canvasLeft, {
  ignoreSelector: '.two-up-handle',
});

const editingScale = ref(false);
const altBackground = ref(false);
const aliasing = ref(false);

const leftDraw = computed(
  () => props.leftCompressed ?? props.source?.preprocessed,
);
const rightDraw = computed(
  () => props.rightCompressed ?? props.source?.preprocessed,
);
// To keep position stable, both images are shown at the size of the source.
const originalImage = computed(() => props.source?.preprocessed);

function canvasStyle(contain: boolean) {
  return {
    width: originalImage.value ? originalImage.value.width + 'px' : '',
    height: originalImage.value ? originalImage.value.height + 'px' : '',
    objectFit: contain ? ('contain' as const) : undefined,
  };
}

const transformStyle = computed(() => ({
  '--x': panZoom.x.value + 'px',
  '--y': panZoom.y.value + 'px',
  '--scale': panZoom.scale.value,
}));

// Canvas sizes are bound in the template, so draw after the DOM update.
watch(
  leftDraw,
  (data) => {
    if (data && canvasLeft.value) drawDataToCanvas(canvasLeft.value, data);
  },
  { flush: 'post' },
);
watch(
  rightDraw,
  (data) => {
    if (data && canvasRight.value) drawDataToCanvas(canvasRight.value, data);
  },
  { flush: 'post' },
);

watch(
  () => props.source,
  (newSource, oldSource) => {
    const sourceFileChanged =
      // Has the value become (un)defined?
      !!newSource !== !!oldSource ||
      // Or has the file changed?
      (newSource && oldSource && newSource.file !== oldSource.file);

    if (sourceFileChanged) {
      // New image? Reset the pan and zoom.
      panZoom.setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }

    const oldData = oldSource?.preprocessed;
    const newData = newSource?.preprocessed;
    if (!oldData || !newData || oldData === newData) return;

    // The transform origin is the top-left of the content, so flip things
    // around a bit when the content size changes (on rotation), so the new
    // content appears central to the previous content.
    const scaleChange = 1 - panZoom.scale.value;
    const oldXScaleOffset = (oldData.width / 2) * scaleChange;
    const oldYScaleOffset = (oldData.height / 2) * scaleChange;

    panZoom.setTransform({
      x: panZoom.x.value - oldXScaleOffset + oldYScaleOffset,
      y: panZoom.y.value - oldYScaleOffset + oldXScaleOffset,
    });
  },
  { flush: 'post' },
);

function zoomIn() {
  panZoom.scaleTo(panZoom.scale.value * 1.25, scaleToOpts);
}

function zoomOut() {
  panZoom.scaleTo(panZoom.scale.value / 1.25, scaleToOpts);
}

async function onScaleValueFocus() {
  editingScale.value = true;
  await nextTick();
  if (!scaleInput.value) return;
  // Firefox unfocuses the input straight away unless I force a style
  // calculation here.
  getComputedStyle(scaleInput.value).transform;
  scaleInput.value.focus();
}

function onScaleInput(event: Event) {
  const percent = parseFloat((event.target as HTMLInputElement).value);
  if (isNaN(percent)) return;
  panZoom.scaleTo(percent / 100, scaleToOpts);
}

/* The split between the two images */

/** Position of the split, as a fraction of the width (or height). */
const relativePosition = ref(0.5);
const containerSize = ref({ width: 0, height: 0 });
const splitDimension = computed(() =>
  props.vertical ? containerSize.value.height : containerSize.value.width,
);
const splitPoint = computed(
  () => relativePosition.value * splitDimension.value + 'px',
);

let handlePointer: number | undefined;
let handleStart = 0;
let positionOnPointerStart = 0;

function pointerAxis(event: PointerEvent) {
  return props.vertical ? event.clientY : event.clientX;
}

function onHandlePointerDown(event: PointerEvent) {
  // We only want to track 1 pointer.
  if (handlePointer !== undefined) return;
  event.preventDefault();
  handlePointer = event.pointerId;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  handleStart = pointerAxis(event);
  positionOnPointerStart = relativePosition.value * splitDimension.value;
}

function onHandlePointerMove(event: PointerEvent) {
  if (event.pointerId !== handlePointer) return;
  const dimension = splitDimension.value;
  const position = positionOnPointerStart + (pointerAxis(event) - handleStart);
  // Clamp position to element bounds.
  relativePosition.value =
    Math.max(0, Math.min(position, dimension)) / dimension;
}

function onHandlePointerUp(event: PointerEvent) {
  if (event.pointerId === handlePointer) handlePointer = undefined;
}

/** Keys 1, 2 and 3 move the split to the start, middle and end. */
function onKeyDown(event: KeyboardEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest('input, select, textarea')) {
    return;
  }

  if (event.code === 'Digit1' || event.code === 'Numpad1') {
    relativePosition.value = 0;
  } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
    relativePosition.value = 0.5;
  } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
    relativePosition.value = 1;
  }
}

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  panZoom.attach();
  window.addEventListener('keydown', onKeyDown);
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    containerSize.value = { width, height };
  });
  resizeObserver.observe(container.value!);

  if (leftDraw.value) drawDataToCanvas(canvasLeft.value!, leftDraw.value);
  if (rightDraw.value) drawDataToCanvas(canvasRight.value!, rightDraw.value);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div :class="['output', { 'alt-background': altBackground }]">
    <div
      ref="container"
      :class="['two-up', 'abs-fill', { vertical }]"
      :style="[transformStyle, { '--split-point': splitPoint }]"
    >
      <div class="pinch-zoom abs-fill">
        <canvas
          ref="canvasLeft"
          :class="['pinch-target', { pixelated: aliasing }]"
          :width="leftDraw?.width"
          :height="leftDraw?.height"
          :style="canvasStyle(leftImgContain)"
        />
      </div>
      <div class="pinch-zoom abs-fill">
        <canvas
          ref="canvasRight"
          :class="['pinch-target', { pixelated: aliasing }]"
          :width="rightDraw?.width"
          :height="rightDraw?.height"
          :style="canvasStyle(rightImgContain)"
        />
      </div>
      <div
        class="two-up-handle"
        @pointerdown="onHandlePointerDown"
        @pointermove="onHandlePointerMove"
        @pointerup="onHandlePointerUp"
        @pointercancel="onHandlePointerUp"
      >
        <div class="scrubber">
          <svg viewBox="0 0 27 20">
            <path class="arrow-left" d="M9.6 0L0 9.6l9.6 9.6z" />
            <path class="arrow-right" d="M17 19.2l9.5-9.6L16.9 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
  <div class="controls">
    <div class="button-group">
      <button class="button first-button" @click="zoomOut">
        <RemoveIcon />
      </button>
      <input
        v-if="editingScale"
        ref="scaleInput"
        type="number"
        step="1"
        min="1"
        max="1000000"
        class="zoom"
        :value="Math.round(panZoom.scale.value * 100)"
        @input="onScaleInput"
        @blur="editingScale = false"
      />
      <span v-else class="zoom" tabindex="0" @focus="onScaleValueFocus">
        <span class="zoom-value">{{
          Math.round(panZoom.scale.value * 100)
        }}</span
        >%
      </span>
      <button class="button last-button" @click="zoomIn">
        <AddIcon />
      </button>
    </div>
    <div class="button-group">
      <button
        class="button first-button"
        title="Rotate"
        @click="emit('rotate')"
      >
        <RotateIcon />
      </button>
      <button
        v-if="!isSafari"
        class="button"
        title="Toggle smoothing"
        @click="aliasing = !aliasing"
      >
        <ToggleAliasingActiveIcon v-if="aliasing" />
        <ToggleAliasingIcon v-else />
      </button>
      <button
        class="button last-button"
        title="Toggle background"
        @click="altBackground = !altBackground"
      >
        <ToggleBackgroundActiveIcon v-if="altBackground" />
        <ToggleBackgroundIcon v-else />
      </button>
    </div>
  </div>
</template>

<style scoped>
.output {
  display: contents;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    opacity: 0.8;
    transition: opacity 500ms ease;
  }

  &.alt-background::before {
    opacity: 0;
  }
}

.two-up {
  --track-color: rgb(0 0 0 / 0.6);
  --thumb-background: var(--black);
  --thumb-color: var(--accent-color);
  --thumb-size: 62px;
  --bar-size: 9px;
  --bar-touch-size: 30px;
  touch-action: none;
}

.pinch-zoom {
  outline: none;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.pinch-zoom:nth-child(1) {
  clip-path: inset(0 calc(100% - var(--split-point)) 0 0);
}

.pinch-zoom:nth-child(2) {
  clip-path: inset(0 0 0 var(--split-point));
}

.vertical .pinch-zoom:nth-child(1) {
  clip-path: inset(0 0 calc(100% - var(--split-point)) 0);
}

.vertical .pinch-zoom:nth-child(2) {
  clip-path: inset(var(--split-point) 0 0 0);
}

.pinch-target {
  transform: translate(var(--x), var(--y)) scale(var(--scale));
  transform-origin: 0 0;
  /* This fixes a severe painting bug in Chrome.
   * We should try to remove this once the issue is fixed.
   * https://bugs.chromium.org/p/chromium/issues/detail?id=870222#c10 */
  will-change: auto;
  /* Prevent the image becoming misshapen due to default flexbox layout. */
  flex-shrink: 0;
}

.two-up-handle {
  touch-action: none;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--bar-touch-size);
  transform: translateX(var(--split-point)) translateX(-50%);
  will-change: transform;
  cursor: ew-resize;
}

.two-up-handle::before {
  content: '';
  display: block;
  height: 100%;
  width: var(--bar-size);
  margin: 0 auto;
  background: var(--track-color);
}

.scrubber {
  display: grid;
  align-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: var(--thumb-background);
  border-radius: var(--thumb-size);
  color: var(--thumb-color);
  box-sizing: border-box;
  padding: 0 calc(var(--thumb-size) * 0.24);
}

.arrow-left {
  fill: var(--pink);
}

.arrow-right {
  fill: var(--blue);
}

.vertical .two-up-handle {
  width: 100%;
  height: var(--bar-touch-size);
  transform: translateY(var(--split-point)) translateY(-50%);
  cursor: ns-resize;
}

.vertical .two-up-handle::before {
  width: auto;
  height: var(--bar-size);
  box-shadow:
    inset 0 calc(var(--bar-size) / 2) 0 rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.4);
  margin: calc((var(--bar-touch-size) - var(--bar-size)) / 2) 0 0 0;
}

.vertical .scrubber {
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -50%) rotate(-90deg);
}

.controls {
  display: flex;
  justify-content: center;
  overflow: hidden;
  flex-wrap: wrap;
  contain: content;
  grid-area: header;
  align-self: center;
  padding: 9px 66px;
  position: relative;
  gap: 6px;

  /* Allow clicks to fall through to the pinch zoom area */
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }

  @media (min-width: 860px) {
    padding: 9px;
    flex-wrap: wrap-reverse;
    grid-area: viewportOpts;
    align-self: end;
  }
}

.button-group {
  display: flex;
  position: relative;
  z-index: 100;
}

.button,
.zoom {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  background-color: rgba(29, 29, 29, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.67);
  border-width: 1px 0 1px 1px;
  line-height: 1.1;
  white-space: nowrap;
  height: 39px;
  padding: 0 8px;
  font-size: 1.2rem;
  cursor: pointer;

  &:focus-visible {
    box-shadow: 0 0 0 2px #fff;
    outline: none;
    z-index: 1;
  }
}

.button {
  color: #fff;
  margin: 0;

  &:hover {
    background: rgba(50, 50, 50, 0.92);
  }

  &.active {
    background: rgba(72, 72, 72, 0.92);
    color: #fff;
  }
}

.first-button {
  border-radius: 6px 0 0 6px;
}

.last-button {
  border-radius: 0 6px 6px 0;
  border-right-width: 1px;
}

.zoom {
  cursor: text;
  width: 7rem;
  font: inherit;
  text-align: center;
  justify-content: center;

  &:focus {
    box-shadow:
      inset 0 1px 4px rgba(0, 0, 0, 0.2),
      0 0 0 2px #fff;
  }
}
span.zoom {
  color: #939393;
  font-size: 0.8rem;
  line-height: 1.2;
  font-weight: 100;
}
input.zoom {
  font-size: 1.2rem;
  letter-spacing: 0.05rem;
  font-weight: 700;
  text-indent: 3px;
  color: #fff;
}

.zoom-value {
  margin: 0 3px 0 0;
  padding: 0 2px;
  font-size: 1.2rem;
  letter-spacing: 0.05rem;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px dashed #999;
}

.pixelated {
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>
