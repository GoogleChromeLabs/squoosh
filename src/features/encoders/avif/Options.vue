<script setup lang="ts">
import { ref } from 'vue';
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import Revealer from '@/components/controls/Revealer.vue';
import Select from '@/components/controls/Select.vue';
import { useDerivedOptions } from '@/composables/useDerivedOptions';
import { AVIFTune, defaultOptions, type EncodeOptions } from './meta';

/**
 * AVIF quality ranges from 0 (worst) to 100 (lossless).
 * Since lossless is a separate checkbox, we cap user-inputted quality at 99
 *
 * AVIF speed ranges from 0 (slowest) to 10 (fastest).
 * We display it as 'effort' to the user since it conveys the speed-size tradeoff
 * much better: speed = 10 - effort
 */
const MAX_QUALITY = 100;
const MAX_EFFORT = 10;

const options = defineModel<EncodeOptions>({ required: true });
const showAdvanced = ref(false);

const form = useDerivedOptions(
  options,
  (options) => {
    const lossless =
      options.quality === MAX_QUALITY &&
      (options.qualityAlpha == -1 || options.qualityAlpha == MAX_QUALITY) &&
      options.subsample == 3;
    const separateAlpha = options.qualityAlpha !== -1;

    return {
      lossless,
      quality: lossless ? defaultOptions.quality : options.quality,
      separateAlpha,
      alphaQuality: separateAlpha ? options.qualityAlpha : options.quality,
      subsample: options.subsample,
      tileRows: options.tileRowsLog2,
      tileCols: options.tileColsLog2,
      effort: MAX_EFFORT - options.speed,
      chromaDeltaQ: options.chromaDeltaQ,
      sharpness: options.sharpness,
      denoiseLevel: options.denoiseLevel,
      tune: options.tune,
      enableSharpYUV: options.enableSharpYUV,
    };
  },
  (form): EncodeOptions => ({
    quality: form.lossless ? MAX_QUALITY : form.quality,
    qualityAlpha:
      form.lossless || !form.separateAlpha
        ? -1 // Set qualityAlpha to quality
        : form.alphaQuality,
    // Always set to 4:4:4 if lossless
    subsample: form.lossless ? 3 : form.subsample,
    tileColsLog2: form.tileCols,
    tileRowsLog2: form.tileRows,
    speed: MAX_EFFORT - form.effort,
    chromaDeltaQ: form.chromaDeltaQ,
    sharpness: form.sharpness,
    denoiseLevel: form.denoiseLevel,
    tune: form.tune,
    enableSharpYUV: form.enableSharpYUV,
  }),
);
</script>

<template>
  <form class="options-section" @submit.prevent>
    <label class="option-toggle">
      Lossless
      <Checkbox v-model="form.lossless" />
    </label>
    <Expander>
      <div v-if="!form.lossless" class="option-one-cell">
        <!-- MAX_QUALITY would mean lossless -->
        <Range v-model="form.quality" :min="0" :max="MAX_QUALITY - 1">
          Quality:
        </Range>
      </div>
    </Expander>
    <label class="option-reveal">
      <Revealer v-model="showAdvanced" />
      Advanced settings
    </label>
    <Expander>
      <div v-if="showAdvanced">
        <Expander>
          <div v-if="!form.lossless">
            <label class="option-text-first">
              Subsample chroma:
              <Select v-model="form.subsample">
                <option :value="0">4:0:0</option>
                <option :value="1">4:2:0</option>
                <option :value="2">4:2:2</option>
                <option :value="3">4:4:4</option>
              </Select>
            </label>
            <Expander>
              <label v-if="form.subsample === 1" class="option-toggle">
                Sharp YUV Downsampling
                <Checkbox v-model="form.enableSharpYUV" />
              </label>
            </Expander>
            <label class="option-toggle">
              Separate alpha quality
              <Checkbox v-model="form.separateAlpha" />
            </label>
            <Expander>
              <div v-if="form.separateAlpha" class="option-one-cell">
                <Range
                  v-model="form.alphaQuality"
                  :min="0"
                  :max="MAX_QUALITY - 1"
                >
                  Alpha quality:
                </Range>
              </div>
            </Expander>
            <label class="option-toggle">
              Extra chroma compression
              <Checkbox v-model="form.chromaDeltaQ" />
            </label>
            <div class="option-one-cell">
              <Range v-model="form.sharpness" :min="0" :max="7">
                Sharpness:
              </Range>
            </div>
            <div class="option-one-cell">
              <Range v-model="form.denoiseLevel" :min="0" :max="50">
                Noise synthesis:
              </Range>
            </div>
            <label class="option-text-first">
              Tuning:
              <Select v-model="form.tune">
                <option :value="AVIFTune.auto">Auto</option>
                <option :value="AVIFTune.psnr">PSNR</option>
                <option :value="AVIFTune.ssim">SSIM</option>
              </Select>
            </label>
          </div>
        </Expander>
        <div class="option-one-cell">
          <Range v-model="form.tileRows" :min="0" :max="6">
            Log2 of tile rows:
          </Range>
        </div>
        <div class="option-one-cell">
          <Range v-model="form.tileCols" :min="0" :max="6">
            Log2 of tile cols:
          </Range>
        </div>
      </div>
    </Expander>
    <div class="option-one-cell">
      <Range v-model="form.effort" :min="0" :max="MAX_EFFORT">Effort:</Range>
    </div>
  </form>
</template>
