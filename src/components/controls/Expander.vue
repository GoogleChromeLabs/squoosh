<!-- Animates the height of its slot content as it appears and disappears.
     The content should be a single element behind a v-if. -->
<script setup lang="ts">
import { transitionHeight } from '@/lib/util';

async function onEnter(el: Element, done: () => void) {
  const element = el as HTMLElement;
  const height = element.getBoundingClientRect().height;
  element.style.overflow = 'hidden';
  await transitionHeight(element, { duration: 300, from: 0, to: height });
  // Unset the height & overflow, so element changes do the right thing.
  element.style.height = '';
  element.style.overflow = '';
  done();
}

async function onLeave(el: Element, done: () => void) {
  const element = el as HTMLElement;
  element.style.pointerEvents = 'none';
  element.style.overflow = 'hidden';
  await transitionHeight(element, { duration: 300, to: 0 });
  done();
}
</script>

<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <slot />
  </Transition>
</template>
