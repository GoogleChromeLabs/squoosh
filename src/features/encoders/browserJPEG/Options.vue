<script setup lang="ts">
import Range from '@/components/controls/Range.vue';
import type { EncodeOptions } from './meta';

const options = defineModel<EncodeOptions>({ required: true });
</script>

<template>
  <div class="options-section">
    <div class="option-one-cell">
      <Range v-model="options.quality" :min="0" :max="1" :step="0.01">
        Quality:
      </Range>
    </div>
  </div>
</template>
