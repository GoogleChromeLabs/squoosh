<!-- Fades and slides its content in when it scrolls into view. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

const root = useTemplateRef<HTMLElement>('root');
let observer: IntersectionObserver | undefined;

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const base = root.value!;
  let wasOutOfView = false;

  observer = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          wasOutOfView = true;
          base.style.opacity = '0';
          return;
        }

        // Only transition in if the element was at some point out of view.
        if (wasOutOfView) {
          base.style.opacity = '';
          base.animate(
            { offset: 0, opacity: '0', transform: 'translateY(40px)' },
            { duration: 300, easing: 'ease' },
          );
        }
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.2 },
  );

  observer.observe(base);
});

// Have to manually disconnect due to memory leaks in browsers.
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="root"><slot /></div>
</template>
