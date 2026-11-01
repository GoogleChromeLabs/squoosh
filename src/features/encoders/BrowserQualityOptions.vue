<!-- Options for the browser's own encoders, which only take a quality. -->
<script setup lang="ts">
import Range from '@/components/controls/Range.vue';

const options = defineModel<{ quality: number }>({ required: true });
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
