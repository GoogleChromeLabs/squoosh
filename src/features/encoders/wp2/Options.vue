<script setup lang="ts">
import { ref } from 'vue';
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import Revealer from '@/components/controls/Revealer.vue';
import Select from '@/components/controls/Select.vue';
import { useDerivedOptions } from '@/composables/useDerivedOptions';
import { Csp, defaultOptions, UVMode, type EncodeOptions } from './meta';

interface FormState {
  effort: number;
  alphaQuality: number;
  passes: number;
  sns: number;
  uvMode: EncodeOptions['uv_mode'];
  colorSpace: EncodeOptions['csp_type'];
  errorDiffusion: number;
  useRandomMatrix: boolean;
  separateAlpha: boolean;
  lossless: boolean;
  slightLoss: number;
  quality: number;
}

const options = defineModel<EncodeOptions>({ required: true });
const showAdvanced = ref(false);

const form = useDerivedOptions(
  options,
  (options, previous?: FormState): FormState => {
    // If quality is > 95, it's lossless with slight loss
    const lossless = options.quality > 95;
    return {
      effort: options.effort,
      alphaQuality: options.alpha_quality,
      passes: options.pass,
      sns: options.sns,
      uvMode: options.uv_mode,
      colorSpace: options.csp_type,
      errorDiffusion: options.error_diffusion,
      useRandomMatrix: options.use_random_matrix,
      separateAlpha: options.quality !== options.alpha_quality,
      lossless,
      slightLoss: lossless
        ? 100 - options.quality
        : (previous?.slightLoss ?? 0),
      quality: lossless
        ? (previous?.quality ?? defaultOptions.quality)
        : options.quality,
    };
  },
  (form): EncodeOptions => ({
    effort: form.effort,
    quality: form.lossless ? 100 - form.slightLoss : form.quality,
    alpha_quality: form.separateAlpha ? form.alphaQuality : form.quality,
    pass: form.passes,
    sns: form.sns,
    uv_mode: form.uvMode,
    csp_type: form.colorSpace,
    error_diffusion: form.errorDiffusion,
    use_random_matrix: form.useRandomMatrix,
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
      <div v-if="form.lossless" class="option-one-cell">
        <Range v-model="form.slightLoss" :min="0" :max="5" :step="0.1">
          Slight loss:
        </Range>
      </div>
    </Expander>
    <Expander>
      <div v-if="!form.lossless">
        <div class="option-one-cell">
          <Range v-model="form.quality" :min="0" :max="95" :step="0.1">
            Quality:
          </Range>
        </div>
        <label class="option-toggle">
          Separate alpha quality
          <Checkbox v-model="form.separateAlpha" />
        </label>
        <Expander>
          <div v-if="form.separateAlpha" class="option-one-cell">
            <Range v-model="form.alphaQuality" :min="0" :max="100" :step="1">
              Alpha Quality:
            </Range>
          </div>
        </Expander>
        <label class="option-reveal">
          <Revealer v-model="showAdvanced" />
          Advanced settings
        </label>
        <Expander>
          <div v-if="showAdvanced">
            <div class="option-one-cell">
              <Range v-model="form.passes" :min="1" :max="10" :step="1">
                Passes:
              </Range>
            </div>
            <div class="option-one-cell">
              <Range v-model="form.sns" :min="0" :max="100" :step="1">
                Spatial noise shaping:
              </Range>
            </div>
            <div class="option-one-cell">
              <Range
                v-model="form.errorDiffusion"
                :min="0"
                :max="100"
                :step="1"
              >
                Error diffusion:
              </Range>
            </div>
            <label class="option-text-first">
              Subsample chroma:
              <Select v-model="form.uvMode">
                <option :value="UVMode.UVModeAuto">Auto</option>
                <option :value="UVMode.UVModeAdapt">Vary</option>
                <option :value="UVMode.UVMode420">Half</option>
                <option :value="UVMode.UVMode444">Off</option>
              </Select>
            </label>
            <label class="option-text-first">
              Color space:
              <Select v-model="form.colorSpace">
                <option :value="Csp.kYCoCg">YCoCg</option>
                <option :value="Csp.kYCbCr">YCbCr</option>
                <option :value="Csp.kYIQ">YIQ</option>
              </Select>
            </label>
            <label class="option-toggle">
              Random matrix
              <Checkbox v-model="form.useRandomMatrix" />
            </label>
          </div>
        </Expander>
      </div>
    </Expander>
    <div class="option-one-cell">
      <Range v-model="form.effort" :min="0" :max="9" :step="1">Effort:</Range>
    </div>
  </form>
</template>
