<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    /** Decimal places in the value bubble. Defaults to the step's. */
    labelPrecision?: number;
  }>(),
  { min: 0, max: 100, step: 1 },
);
const value = defineModel<number>({ required: true });

const rangeEl = useTemplateRef<HTMLInputElement>('range');
const dragging = ref(false);
const textFocused = ref(false);
/** What's in the number field while it has focus. */
const typedText = ref('');

function getPrecision(value: number): number {
  const afterDecimal = String(value).split('.')[1];
  return afterDecimal ? afterDecimal.length : 0;
}

const displayValue = computed(() => {
  const current = value.value || 0;
  if (current >= 10000) return (current / 1000).toFixed(1) + 'k';

  const precision = props.labelPrecision || getPrecision(props.step);
  return precision
    ? current.toFixed(precision)
    : Math.round(current).toString();
});

const percent = computed(
  () => (100 * ((value.value || 0) - props.min)) / (props.max - props.min),
);

function onRangeInput(event: Event) {
  value.value = Number((event.target as HTMLInputElement).value);
}

function onTextInput(event: Event) {
  const text = (event.target as HTMLInputElement).value;
  typedText.value = text;
  if (!text.trim()) return;
  // Let the range input clamp the value and snap it to the step.
  const range = rangeEl.value!;
  range.value = text;
  value.value = Number(range.value);
}

function onTextFocus(event: FocusEvent) {
  typedText.value = (event.target as HTMLInputElement).value;
  textFocused.value = true;
}

// Not using pointer capture here due to https://bugs.webkit.org/show_bug.cgi?id=219636.
let activePointer: number | undefined;

function onPointerDown(event: PointerEvent) {
  if (activePointer !== undefined) return;
  activePointer = event.pointerId;
  dragging.value = true;

  const pointerUp = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    activePointer = undefined;
    dragging.value = false;
    window.removeEventListener('pointerup', pointerUp);
    window.removeEventListener('pointercancel', pointerUp);
  };
  window.addEventListener('pointerup', pointerUp);
  window.addEventListener('pointercancel', pointerUp);
}
</script>

<template>
  <label class="range">
    <span class="label-text"><slot /></span>
    <!-- On interaction, Safari gives focus to the first element in the label,
         so the range input is deliberately first. -->
    <div class="range-wc-container">
      <div
        :class="['range-input', { disabled }]"
        :style="{
          '--value-percent': percent + '%',
          '--value-width': displayValue.length,
        }"
        @pointerdown="onPointerDown"
      >
        <input
          ref="range"
          type="range"
          :class="['input', { 'touch-active': dragging }]"
          :min="min"
          :max="max"
          :step="step"
          :value="value"
          :disabled="disabled"
          @input="onRangeInput"
        />
        <div class="thumb-wrapper">
          <div class="thumb"></div>
          <div class="value-display">
            <svg width="32" height="62">
              <path
                d="M27.3 27.3C25 29.6 17 35.8 17 43v3c0 3 2.5 5 3.2 5.8a6 6 0 1 1-8.5 0C12.6 51 15 49 15 46v-3c0-7.2-8-13.4-10.3-15.7A16 16 0 0 1 16 0a16 16 0 0 1 11.3 27.3z"
              />
            </svg>
            <span>{{ displayValue }}</span>
          </div>
        </div>
      </div>
    </div>
    <input
      type="number"
      class="text-input"
      :value="textFocused ? typedText : value"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="onTextInput"
      @focus="onTextFocus"
      @blur="textFocused = false"
    />
  </label>
</template>

<style scoped>
.range {
  position: relative;
  z-index: 0;
  display: grid;
  grid-template-columns: 1fr auto;
}

.label-text {
  color: #fff; /* TEMP */
}

.range-wc-container {
  position: relative;
  z-index: 1;
  grid-row: 2 / 3;
  grid-column: 1 / 3;
}

.text-input {
  grid-row: 1 / 2;
  grid-column: 2 / 3;

  text-align: right;
  background: transparent;
  color: inherit;
  font: inherit;
  border: none;
  padding: 2px 5px;
  box-sizing: border-box;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--main-theme-color);
  text-underline-position: under;
  width: 54px;
  position: relative;
  left: 5px;

  &:focus {
    background: #fff;
    color: #000;
  }

  /* Remove the number controls */
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -moz-appearance: none;
    -webkit-appearance: none;
    margin: 0;
  }
}

.range-input {
  position: relative;
  display: flex;
  height: 18px;
  width: 100%;
  margin: 2px;
  font: inherit;
  line-height: 16px;
  overflow: visible;
}

/* Disabled inputs are greyed out */
.range-input.disabled {
  filter: grayscale(1);
}

.range-input::before {
  content: '';
  display: block;
  position: absolute;
  top: 8px;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(var(--main-theme-color), var(--main-theme-color))
    0 / var(--value-percent, 0%) 100% no-repeat var(--medium-light-gray);
}

.input {
  position: relative;
  width: 100%;
  padding: 0;
  margin: 0;
  opacity: 0;
}

.thumb {
  pointer-events: none;
  position: absolute;
  bottom: 3px;
  left: 0;
  margin-left: -6px;
  background: var(--main-theme-color);
  border-radius: 50%;
  width: 12px;
  height: 12px;
}

.range-input:focus-within .thumb {
  outline: white solid 2px;
}

.thumb-wrapper {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 0;
  height: 0;
  overflow: visible;
  transform: translate(var(--value-percent, 0%), 0);
}

.value-display {
  position: absolute;
  box-sizing: border-box;
  left: 0;
  bottom: 3px;
  width: 32px;
  height: 62px;
  text-align: center;
  padding: 8px 3px 0;
  margin: 0 0 0 -16px;
  transform-origin: 50% 90%;
  opacity: 0.0001;
  transform: scale(0.2);
  color: #fff;
  font: inherit;
  font-size: calc(100% - var(--value-width, 3) / 5 * 0.2em);
  text-overflow: clip;
  text-shadow: 0 -0.5px 0 rgba(0, 0, 0, 0.4);
  transition: all 200ms ease;
  transition-property: opacity, transform;
  will-change: transform;
  pointer-events: none;
  overflow: hidden;

  > svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    fill: var(--main-theme-color);
  }

  > span {
    position: relative;
  }
}

.touch-active + .thumb-wrapper .value-display {
  opacity: 1;
  transform: scale(1);
}

.touch-active + .thumb-wrapper .thumb {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
</style>
