<!-- An accordion of heading/content pairs where only one panel is open at a
     time. Used for the options on narrow screens. Slots: heading-0,
     content-0, heading-1, content-1, ... -->
<script setup lang="ts">
import { nextTick, reactive, ref, useId } from 'vue';
import { transitionHeight } from '@/lib/util';

const props = defineProps<{
  count: number;
  /** Extra classes for each heading/content pair. */
  panelClasses?: string[];
}>();

const id = useId();
const expanded = reactive<boolean[]>(Array(props.count).fill(false));
/** The heading that's in the tab order. */
const focusIndex = ref(0);
const headings: HTMLElement[] = [];
const contents: HTMLElement[] = [];

async function setExpanded(index: number, value: boolean) {
  const content = contents[index];
  const from = content.getBoundingClientRect().height;
  expanded[index] = value;
  await nextTick();
  const to = value ? content.getBoundingClientRect().height : 0;
  await transitionHeight(content, { from, to, duration: 300 });
  content.style.height = '';
}

function toggle(index: number) {
  if (expanded[index]) {
    setExpanded(index, false);
    return;
  }
  expanded.forEach((isExpanded, other) => {
    if (isExpanded) setExpanded(other, false);
  });
  setExpanded(index, true);
}

function onHeadingClick(event: MouseEvent, index: number) {
  // Links and buttons inside the heading do their own thing.
  const target = event.target as Element;
  if (target.closest('a, button') !== null) return;
  toggle(index);
}

function onHeadingKeyDown(event: KeyboardEvent, index: number) {
  // If something inside of heading has focus, ignore
  if (event.target !== event.currentTarget) return;
  // Don't handle modifier shortcuts used by assistive technology.
  if (event.altKey) return;

  let newIndex: number | undefined;

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      newIndex = Math.max(index - 1, 0);
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      newIndex = Math.min(index + 1, props.count - 1);
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = props.count - 1;
      break;
    case 'Enter':
    case ' ':
      toggle(index);
      break;
    // Any other key press is ignored and passed back to the browser.
    default:
      return;
  }

  event.preventDefault();
  if (newIndex !== undefined) {
    focusIndex.value = newIndex;
    headings[newIndex].focus();
  }
}
</script>

<template>
  <div class="multi-panel">
    <template v-for="index in count" :key="index">
      <div
        :id="`${id}-heading-${index - 1}`"
        :ref="(el) => (headings[index - 1] = el as HTMLElement)"
        :class="['panel-heading', panelClasses?.[index - 1]]"
        :tabindex="focusIndex === index - 1 ? 0 : -1"
        :aria-controls="`${id}-content-${index - 1}`"
        :content-expanded="expanded[index - 1] ? '' : undefined"
        @click="onHeadingClick($event, index - 1)"
        @keydown="onHeadingKeyDown($event, index - 1)"
      >
        <slot :name="`heading-${index - 1}`" />
      </div>
      <div
        :id="`${id}-content-${index - 1}`"
        :ref="(el) => (contents[index - 1] = el as HTMLElement)"
        :class="['panel-content', panelClasses?.[index - 1]]"
        :aria-labelledby="`${id}-heading-${index - 1}`"
        :aria-expanded="expanded[index - 1] ? 'true' : 'false'"
      >
        <slot :name="`content-${index - 1}`" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.panel-content {
  height: 0px;
  overflow: auto;
}
.panel-content[aria-expanded='true'] {
  height: auto;
}
</style>
