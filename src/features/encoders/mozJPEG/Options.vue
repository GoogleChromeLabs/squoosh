<script setup lang="ts">
import { ref } from 'vue';
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import Revealer from '@/components/controls/Revealer.vue';
import Select from '@/components/controls/Select.vue';
import { MozJpegColorSpace, type EncodeOptions } from './meta';

const options = defineModel<EncodeOptions>({ required: true });
const showAdvanced = ref(false);
</script>

<template>
  <form class="options-section" @submit.prevent>
    <div class="option-one-cell">
      <Range v-model="options.quality" :min="0" :max="100">Quality:</Range>
    </div>
    <label class="option-reveal">
      <Revealer v-model="showAdvanced" />
      Advanced settings
    </label>
    <Expander>
      <div v-if="showAdvanced">
        <label class="option-text-first">
          Channels:
          <Select v-model="options.color_space">
            <option :value="MozJpegColorSpace.GRAYSCALE">Grayscale</option>
            <option :value="MozJpegColorSpace.RGB">RGB</option>
            <option :value="MozJpegColorSpace.YCbCr">YCbCr</option>
          </Select>
        </label>
        <Expander>
          <div v-if="options.color_space === MozJpegColorSpace.YCbCr">
            <label class="option-toggle">
              Auto subsample chroma
              <Checkbox v-model="options.auto_subsample" />
            </label>
            <Expander>
              <div v-if="!options.auto_subsample" class="option-one-cell">
                <Range v-model="options.chroma_subsample" :min="1" :max="4">
                  Subsample chroma by:
                </Range>
              </div>
            </Expander>
            <label class="option-toggle">
              Separate chroma quality
              <Checkbox v-model="options.separate_chroma_quality" />
            </label>
            <Expander>
              <div
                v-if="options.separate_chroma_quality"
                class="option-one-cell"
              >
                <Range v-model="options.chroma_quality" :min="0" :max="100">
                  Chroma quality:
                </Range>
              </div>
            </Expander>
          </div>
        </Expander>
        <label class="option-toggle">
          Pointless spec compliance
          <Checkbox v-model="options.baseline" />
        </label>
        <Expander>
          <label v-if="!options.baseline" class="option-toggle">
            Progressive rendering
            <Checkbox v-model="options.progressive" />
          </label>
        </Expander>
        <Expander>
          <label v-if="options.baseline" class="option-toggle">
            Optimize Huffman table
            <Checkbox v-model="options.optimize_coding" />
          </label>
        </Expander>
        <div class="option-one-cell">
          <Range v-model="options.smoothing" :min="0" :max="100">
            Smoothing:
          </Range>
        </div>
        <label class="option-text-first">
          Quantization:
          <Select v-model="options.quant_table">
            <option :value="0">JPEG Annex K</option>
            <option :value="1">Flat</option>
            <option :value="2">MSSIM-tuned Kodak</option>
            <option :value="3">ImageMagick</option>
            <option :value="4">PSNR-HVS-M-tuned Kodak</option>
            <option :value="5">Klein et al</option>
            <option :value="6">Watson et al</option>
            <option :value="7">Ahumada et al</option>
            <option :value="8">Peterson et al</option>
          </Select>
        </label>
        <label class="option-toggle">
          Trellis multipass
          <Checkbox v-model="options.trellis_multipass" />
        </label>
        <Expander>
          <label v-if="options.trellis_multipass" class="option-toggle">
            Optimize zero block runs
            <Checkbox v-model="options.trellis_opt_zero" />
          </label>
        </Expander>
        <label class="option-toggle">
          Optimize after trellis quantization
          <Checkbox v-model="options.trellis_opt_table" />
        </label>
        <div class="option-one-cell">
          <Range v-model="options.trellis_loops" :min="1" :max="50">
            Trellis quantization passes:
          </Range>
        </div>
      </div>
    </Expander>
  </form>
</template>
