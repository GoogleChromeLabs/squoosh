<script setup lang="ts" generic="T">
import { Arrow } from '@/components/icons';

defineOptions({ inheritAttrs: false });
defineProps<{ large?: boolean }>();
const value = defineModel<T>();
</script>

<template>
  <div :class="['select', { large }]">
    <select v-model="value" class="builtin-select" v-bind="$attrs">
      <slot />
    </select>
    <div class="arrow">
      <Arrow />
    </div>
  </div>
</template>

<style scoped>
.select {
  position: relative;
}

.builtin-select {
  background: var(--black);
  border-radius: 4px;
  font: inherit;
  padding: 7px 0;
  padding-right: 25px;
  padding-left: 10px;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: none;
  color: #fff;
  width: 100%;
}

.arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  fill: #fff;
  width: 10px;
  pointer-events: none;
}

.large .builtin-select {
  padding: 10px 35px 10px 10px;
  background: var(--dark-gray);
}
</style>
