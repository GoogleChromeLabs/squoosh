<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type Component,
} from 'vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import SnackBar from '@/components/SnackBar.vue';
import IntroPage from '@/components/intro/IntroPage.vue';
import { showSnack } from '@/composables/useSnackbar';
import {
  getSharedImage,
  isShareTarget,
  registerServiceWorker,
} from '@/lib/sw-bridge';

const ROUTE_EDITOR = '/editor';

const file = shallowRef<File>();
const isEditorOpen = ref(false);
const dropValid = ref(false);
/** Opened by sharing an image to the app, which the service worker hands over. */
const awaitingShareTarget = ref(isShareTarget());

// Start loading the editor straight away.
const CompressView = shallowRef<Component>();
import('@/components/editor/CompressView.vue')
  .then((module) => (CompressView.value = module.default))
  .catch(() => showSnack('Failed to load app'));

// There's nothing to edit after a reload, so start on the intro.
if (location.pathname === ROUTE_EDITOR) {
  history.replaceState(null, '', '/' + location.search);
}

function openEditor() {
  if (isEditorOpen.value) return;
  // Change path, but preserve query string.
  const editorURL = new URL(location.href);
  editorURL.pathname = ROUTE_EDITOR;
  history.pushState(null, '', editorURL.href);
  isEditorOpen.value = true;
}

function openFile(newFile: File) {
  openEditor();
  file.value = newFile;
}

function back() {
  history.back();
}

function onPopState() {
  isEditorOpen.value = location.pathname === ROUTE_EDITOR && !!file.value;
}

/* Drag & drop and paste anywhere in the app */

let dragEnterCount = 0;

function hasFiles(dataTransfer: DataTransfer | null) {
  return (
    !!dataTransfer &&
    [...dataTransfer.items].some((item) => item.kind === 'file')
  );
}

function firstFile(dataTransfer: DataTransfer | null) {
  for (const item of dataTransfer?.items ?? []) {
    const itemFile = item.kind === 'file' && item.getAsFile();
    if (itemFile) return itemFile;
  }
}

function onDragEnter(event: DragEvent) {
  dragEnterCount += 1;
  if (dragEnterCount === 1) dropValid.value = hasFiles(event.dataTransfer);
}

function onDragLeave() {
  dragEnterCount -= 1;
  if (dragEnterCount === 0) dropValid.value = false;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragEnterCount = 0;
  dropValid.value = false;
  const droppedFile = firstFile(event.dataTransfer);
  if (droppedFile) openFile(droppedFile);
}

function onPaste(event: ClipboardEvent) {
  const pastedFile = firstFile(event.clipboardData);
  if (pastedFile) openFile(pastedFile);
}

// Since iOS 10, Apple tries to prevent disabling pinch-zoom. This is great in
// theory, but really breaks things on Squoosh, as you can easily end up
// zooming the UI when you mean to zoom the image. Once you've done this, it's
// really difficult to undo. Anyway, this seems to prevent it.
function preventGesture(event: Event) {
  event.preventDefault();
}

async function receiveSharedImage() {
  const sharedFile = await getSharedImage();
  // Remove the ?share-target from the URL
  history.replaceState(null, '', '/');
  awaitingShareTarget.value = false;
  openFile(sharedFile);
}

onMounted(() => {
  registerServiceWorker(showSnack);
  if (awaitingShareTarget.value) receiveSharedImage();
  document.body.addEventListener('gesturestart', preventGesture);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('paste', onPaste);
});

onBeforeUnmount(() => {
  document.body.removeEventListener('gesturestart', preventGesture);
  window.removeEventListener('popstate', onPopState);
  window.removeEventListener('paste', onPaste);
});
</script>

<template>
  <div class="app">
    <div
      :class="['drop', { 'drop-valid': dropValid }]"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragend="onDragLeave"
      @dragover.prevent
      @drop="onDrop"
    >
      <LoadingSpinner v-if="awaitingShareTarget" class="app-loader" />
      <template v-else-if="isEditorOpen && file">
        <component
          :is="CompressView"
          v-if="CompressView"
          :file="file"
          @back="back"
        />
        <LoadingSpinner v-else class="app-loader" />
      </template>
      <IntroPage v-else @file="openFile" />
      <SnackBar />
    </div>
  </div>
</template>

<style scoped>
.app {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  contain: strict;
}

.drop {
  overflow: hidden;
  touch-action: none;
  height: 100%;
  width: 100%;

  &::after {
    content: '';
    position: absolute;
    display: block;
    left: 10px;
    top: 10px;
    right: 10px;
    bottom: 10px;
    border: 2px dashed #fff;
    background-color: rgba(0, 0, 0, 0.1);
    border-color: var(--pink);
    border-radius: 10px;
    opacity: 0;
    transform: scale(0.95);
    transition: all 200ms ease-in;
    transition-property: transform, opacity;
    pointer-events: none;
  }

  &.drop-valid::after {
    opacity: 1;
    transform: scale(1);
    transition-timing-function: ease-out;
  }
}

.app-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  --size: 225px;
  --stroke-width: 26px;
}
</style>
