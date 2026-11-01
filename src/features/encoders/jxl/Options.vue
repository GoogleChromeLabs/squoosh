<script setup lang="ts">
import Checkbox from '@/components/controls/Checkbox.vue';
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import { useDerivedOptions } from '@/composables/useDerivedOptions';
import type { EncodeOptions } from './meta';

const options = defineModel<EncodeOptions>({ required: true });

const form = useDerivedOptions(
  options,
  (options) => ({
    effort: options.effort,
    quality: options.quality,
    progressive: options.progressive,
    edgePreservingFilter: options.epf === -1 ? 2 : options.epf,
    lossless: options.quality === 100,
    slightLoss: options.lossyPalette,
    autoEdgePreservingFilter: options.epf === -1,
    decodingSpeedTier: options.decodingSpeedTier,
    photonNoiseIso: options.photonNoiseIso,
    alternativeLossy: options.lossyModular,
  }),
  (form): EncodeOptions => ({
    effort: form.effort,
    quality: form.lossless ? 100 : form.quality,
    progressive: form.progressive,
    epf: form.autoEdgePreservingFilter ? -1 : form.edgePreservingFilter,
    lossyPalette: form.lossless ? form.slightLoss : false,
    decodingSpeedTier: form.decodingSpeedTier,
    photonNoiseIso: form.photonNoiseIso,
    lossyModular: form.quality < 7 ? true : form.alternativeLossy,
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
      <label v-if="form.lossless" class="option-toggle">
        Slight loss
        <Checkbox v-model="form.slightLoss" />
      </label>
    </Expander>
    <Expander>
      <div v-if="!form.lossless">
        <div class="option-one-cell">
          <Range v-model="form.quality" :min="0" :max="99.9" :step="0.1">
            Quality:
          </Range>
        </div>
        <label class="option-toggle">
          Alternative lossy mode
          <Checkbox
            :model-value="form.quality < 7 ? true : form.alternativeLossy"
            :disabled="form.quality < 7"
            @update:model-value="form.alternativeLossy = $event"
          />
        </label>
        <label class="option-toggle">
          Auto edge filter
          <Checkbox v-model="form.autoEdgePreservingFilter" />
        </label>
        <Expander>
          <div v-if="!form.autoEdgePreservingFilter" class="option-one-cell">
            <Range v-model="form.edgePreservingFilter" :min="0" :max="3">
              Edge preserving filter:
            </Range>
          </div>
        </Expander>
        <div class="option-one-cell">
          <Range v-model="form.decodingSpeedTier" :min="0" :max="4">
            Optimise for decoding speed (worse compression):
          </Range>
        </div>
        <div class="option-one-cell">
          <Range
            v-model="form.photonNoiseIso"
            :min="0"
            :max="50000"
            :step="100"
          >
            Noise equivalent to ISO:
          </Range>
        </div>
      </div>
    </Expander>
    <label class="option-toggle">
      Progressive rendering
      <Checkbox v-model="form.progressive" />
    </label>
    <div class="option-one-cell">
      <Range v-model="form.effort" :min="1" :max="9">Effort:</Range>
    </div>
  </form>
</template>
