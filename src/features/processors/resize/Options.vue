<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Select from '@/components/controls/Select.vue';
import { workerResizeMethods, type Options } from './meta';

const props = defineProps<{
  isVector: boolean;
  inputWidth: number;
  inputHeight: number;
}>();
/** premultiply and linearRGB only exist for the worker methods. */
const options = defineModel<
  Options & { premultiply?: boolean; linearRGB?: boolean }
>({ required: true });

const maintainAspect = ref(true);

const sizePresets = [0.25, 0.3333, 0.5, 1, 2, 3, 4];

const aspect = computed(() => props.inputWidth / props.inputHeight);

const isWorkerMethod = computed(() =>
  (workerResizeMethods as string[]).includes(options.value.method),
);

function setSize(width: number, height: number) {
  // Same rule as the inputs: whole numbers of at least 1.
  if (!(width >= 1 && height >= 1)) return;
  options.value.width = width;
  options.value.height = height;
}

const preset = computed({
  get() {
    const { width, height } = options.value;
    const match = sizePresets.find(
      (preset) =>
        width === Math.round(props.inputWidth * preset) &&
        height === Math.round(props.inputHeight * preset),
    );
    return match ?? 'custom';
  },
  set(preset: number | 'custom') {
    if (preset === 'custom') return;
    setSize(
      Math.round(props.inputWidth * preset),
      Math.round(props.inputHeight * preset),
    );
  },
});

function onWidthInput(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.checkValidity()) return;
  const width = Number(input.value);
  setSize(
    width,
    maintainAspect.value
      ? Math.round(width / aspect.value)
      : options.value.height,
  );
}

function onHeightInput(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.checkValidity()) return;
  const height = Number(input.value);
  setSize(
    maintainAspect.value
      ? Math.round(height * aspect.value)
      : options.value.width,
    height,
  );
}

watch(maintainAspect, (maintain) => {
  if (!maintain) return;
  setSize(options.value.width, Math.round(options.value.width / aspect.value));
});
</script>

<template>
  <form class="options-section" @submit.prevent>
    <label class="option-text-first">
      Method:
      <Select v-model="options.method">
        <option v-if="isVector" value="vector">Vector</option>
        <option value="lanczos3">Lanczos3</option>
        <option value="mitchell">Mitchell</option>
        <option value="catrom">Catmull-Rom</option>
        <option value="triangle">Triangle (bilinear)</option>
        <option value="hqx">hqx (pixel art)</option>
        <option value="browser-pixelated">Browser pixelated</option>
        <option value="browser-low">Browser low quality</option>
        <option value="browser-medium">Browser medium quality</option>
        <option value="browser-high">Browser high quality</option>
      </Select>
    </label>
    <label class="option-text-first">
      Preset:
      <Select v-model="preset">
        <option v-for="size in sizePresets" :key="size" :value="size">
          {{ size * 100 }}%
        </option>
        <option value="custom">Custom</option>
      </Select>
    </label>
    <label class="option-text-first">
      Width:
      <input
        required
        class="text-field"
        type="number"
        min="1"
        :value="options.width"
        @input="onWidthInput"
      />
    </label>
    <label class="option-text-first">
      Height:
      <input
        required
        class="text-field"
        type="number"
        min="1"
        :value="options.height"
        @input="onHeightInput"
      />
    </label>
    <Expander>
      <div v-if="isWorkerMethod">
        <label class="option-toggle">
          Premultiply alpha channel
          <Checkbox v-model="options.premultiply" />
        </label>
        <label class="option-toggle">
          Linear RGB
          <Checkbox v-model="options.linearRGB" />
        </label>
      </div>
    </Expander>
    <label class="option-toggle">
      Maintain aspect ratio
      <Checkbox v-model="maintainAspect" />
    </label>
    <Expander>
      <label v-if="!maintainAspect" class="option-text-first">
        Fit method:
        <Select v-model="options.fitMethod">
          <option value="stretch">Stretch</option>
          <option value="contain">Contain</option>
        </Select>
      </label>
    </Expander>
  </form>
</template>
