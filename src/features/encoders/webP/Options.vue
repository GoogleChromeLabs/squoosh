<script setup lang="ts">
import { computed, ref } from 'vue';
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import Revealer from '@/components/controls/Revealer.vue';
import Select from '@/components/controls/Select.vue';
import type { EncodeOptions } from './meta';

const WEBP_HINT_DEFAULT = 0; // default preset.
const WEBP_HINT_GRAPH = 3; // Discrete tone image (graph, map-tile etc).

// From kLosslessPresets in config_enc.c
// The format is [method, quality].
const losslessPresets: [number, number][] = [
  [0, 0],
  [1, 20],
  [2, 25],
  [3, 30],
  [3, 50],
  [4, 50],
  [4, 75],
  [4, 90],
  [5, 90],
  [6, 100],
];
const losslessPresetDefault = 6;

function determineLosslessQuality(quality: number, method: number): number {
  const index = losslessPresets.findIndex(
    ([presetMethod, presetQuality]) =>
      presetMethod === method && presetQuality === quality,
  );
  if (index !== -1) return index;
  // Quality doesn't match one of the presets.
  // This can happen when toggling 'lossless'.
  return losslessPresetDefault;
}

const options = defineModel<EncodeOptions>({ required: true });
const showAdvanced = ref(false);

/** Maps a 0/1 option onto a checkbox. */
function flag(key: keyof EncodeOptions) {
  return computed({
    get: () => !!options.value[key],
    set: (checked: boolean) => (options.value[key] = Number(checked)),
  });
}

/** Maps an option onto a range that runs the other way. */
function inverted(key: keyof EncodeOptions, max: number) {
  return computed({
    get: () => max - options.value[key],
    set: (value: number) => (options.value[key] = max - value),
  });
}

function applyLosslessPreset(preset: number) {
  [options.value.method, options.value.quality] = losslessPresets[preset];
}

const losslessPreset = computed({
  get: () =>
    determineLosslessQuality(options.value.quality, options.value.method),
  set: applyLosslessPreset,
});

const lossless = computed({
  get: () => !!options.value.lossless,
  set(checked: boolean) {
    // In lossless mode, the quality and method come from the preset.
    if (checked) applyLosslessPreset(losslessPreset.value);
    options.value.lossless = Number(checked);
  },
});

// Although there are 3 different kinds of image hint, webp only seems to do
// something with the 'graph' type, and I don't really understand what it does.
const discreteTone = computed({
  get: () => options.value.image_hint === WEBP_HINT_GRAPH,
  set: (checked: boolean) =>
    (options.value.image_hint = checked ? WEBP_HINT_GRAPH : WEBP_HINT_DEFAULT),
});

const slightLoss = inverted('near_lossless', 100);
const filterSharpness = inverted('filter_sharpness', 7);
const exact = flag('exact');
const alphaCompression = flag('alpha_compression');
const autofilter = flag('autofilter');
const strongFilter = flag('filter_type');
const sharpYuv = flag('use_sharp_yuv');
</script>

<template>
  <form class="options-section" @submit.prevent>
    <label class="option-toggle">
      Lossless
      <Checkbox v-model="lossless" />
    </label>
    <div v-if="lossless" key="lossless">
      <div class="option-one-cell">
        <Range v-model="losslessPreset" :min="0" :max="9">Effort:</Range>
      </div>
      <div class="option-one-cell">
        <Range v-model="slightLoss" :min="0" :max="100">Slight loss:</Range>
      </div>
      <label class="option-toggle">
        Discrete tone image
        <Checkbox v-model="discreteTone" />
      </label>
    </div>
    <div v-else key="lossy">
      <div class="option-one-cell">
        <Range v-model="options.method" :min="0" :max="6">Effort:</Range>
      </div>
      <div class="option-one-cell">
        <Range v-model="options.quality" :min="0" :max="100" :step="0.1">
          Quality:
        </Range>
      </div>
      <label class="option-reveal">
        <Revealer v-model="showAdvanced" />
        Advanced settings
      </label>
      <Expander>
        <div v-if="showAdvanced">
          <label class="option-toggle">
            Compress alpha
            <Checkbox v-model="alphaCompression" />
          </label>
          <div class="option-one-cell">
            <Range v-model="options.alpha_quality" :min="0" :max="100">
              Alpha quality:
            </Range>
          </div>
          <div class="option-one-cell">
            <Range v-model="options.alpha_filtering" :min="0" :max="2">
              Alpha filter quality:
            </Range>
          </div>
          <label class="option-toggle">
            Auto adjust filter strength
            <Checkbox v-model="autofilter" />
          </label>
          <Expander>
            <div v-if="!autofilter" class="option-one-cell">
              <Range v-model="options.filter_strength" :min="0" :max="100">
                Filter strength:
              </Range>
            </div>
          </Expander>
          <label class="option-toggle">
            Strong filter
            <Checkbox v-model="strongFilter" />
          </label>
          <div class="option-one-cell">
            <Range v-model="filterSharpness" :min="0" :max="7">
              Filter sharpness:
            </Range>
          </div>
          <label class="option-toggle">
            Sharp RGB→YUV conversion
            <Checkbox v-model="sharpYuv" />
          </label>
          <div class="option-one-cell">
            <Range v-model="options.pass" :min="1" :max="10">Passes:</Range>
          </div>
          <div class="option-one-cell">
            <Range v-model="options.sns_strength" :min="0" :max="100">
              Spatial noise shaping:
            </Range>
          </div>
          <label class="option-text-first">
            Preprocess:
            <Select v-model="options.preprocessing">
              <option :value="0">None</option>
              <option :value="1">Segment smooth</option>
              <option :value="2">Pseudo-random dithering</option>
            </Select>
          </label>
          <div class="option-one-cell">
            <Range v-model="options.segments" :min="1" :max="4">
              Segments:
            </Range>
          </div>
          <div class="option-one-cell">
            <Range v-model="options.partitions" :min="0" :max="3">
              Partitions:
            </Range>
          </div>
        </div>
      </Expander>
    </div>
    <label class="option-toggle">
      Preserve transparent data
      <Checkbox v-model="exact" />
    </label>
  </form>
</template>
