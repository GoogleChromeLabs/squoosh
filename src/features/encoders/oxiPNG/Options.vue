<script setup lang="ts">
import Checkbox from '@/components/controls/Checkbox.vue';
import Range from '@/components/controls/Range.vue';
import type { EncodeOptions } from './meta';

const options = defineModel<EncodeOptions>({ required: true });
</script>

<template>
  <form class="options-section" @submit.prevent>
    <label class="option-toggle">
      Interlace
      <Checkbox v-model="options.interlace" />
    </label>
    <div class="option-one-cell">
      <Range v-model="options.level" :min="0" :max="6" :step="1">Effort:</Range>
    </div>
  </form>
</template>
