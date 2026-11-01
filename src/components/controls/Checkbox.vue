<script setup lang="ts">
import { CheckedIcon, UncheckedIcon } from '@/components/icons';

defineOptions({ inheritAttrs: false });
defineProps<{ disabled?: boolean }>();
const checked = defineModel<boolean>({ default: false });
</script>

<template>
  <div class="checkbox">
    <CheckedIcon
      v-if="checked"
      :class="['icon', disabled ? 'disabled' : 'checked']"
    />
    <UncheckedIcon v-else class="icon" />
    <input
      v-model="checked"
      class="real-checkbox"
      type="checkbox"
      :disabled="disabled"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped>
.checkbox {
  display: inline-block;
  position: relative;
  --size: 17px;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    background-color: var(--main-theme-color);
    border-radius: 999px;
    opacity: 0.25;

    transform: translate(-50%, -50%) scale(0);
    transition-property: transform;
    transition-duration: 250ms;
  }

  &:focus-within::before {
    transform: translate(-50%, -50%) scale(1);
  }
}

.real-checkbox {
  top: 0;
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.icon {
  display: block;
  width: var(--size);
  height: var(--size);
}

.checked {
  fill: var(--main-theme-color);
}

.disabled {
  fill: var(--dark-gray);
}
</style>
