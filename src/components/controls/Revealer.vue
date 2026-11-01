<script setup lang="ts">
import { Arrow } from '@/components/icons';

defineOptions({ inheritAttrs: false });
const checked = defineModel<boolean>({ default: false });
</script>

<template>
  <div class="checkbox">
    <input
      v-model="checked"
      class="real-checkbox"
      type="checkbox"
      v-bind="$attrs"
    />
    <div class="arrow">
      <Arrow />
    </div>
  </div>
</template>

<style scoped>
.checkbox {
  display: inline-block;
  position: relative;
}

.arrow {
  width: 10px;
  height: 10px;
  fill: var(--white);
  transition: transform 200ms ease;
  transform: rotate(-90deg);

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.real-checkbox {
  top: 0;
  position: absolute;
  opacity: 0;
  pointer-events: none;

  &:checked + .arrow {
    transform: none;
  }
}
</style>
