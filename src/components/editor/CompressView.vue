<!-- The editor: the image comparison, and the options and results for each
     side. -->
<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useCompressor, type Side } from '@/composables/useCompressor';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { showSnack } from '@/composables/useSnackbar';
import { encoderMap } from '@/features/registry';
import ImageOutput from './ImageOutput.vue';
import MultiPanel from './MultiPanel.vue';
import OptionsPanel from './OptionsPanel.vue';
import ResultsBubble from './ResultsBubble.vue';

const props = defineProps<{ file: File }>();
const emit = defineEmits<{ back: [] }>();

const compressor = useCompressor(toRef(props, 'file'), showSnack);
const { source, loading, preprocessorState, sides, hasSavedSettings } =
  compressor;

const mobileView = useMediaQuery('(max-width: 599px)');

function typeLabel(side: Side) {
  const encoderState = side.latestSettings.encoderState;
  if (encoderState) return encoderMap[encoderState.type].meta.label;
  return side.file ? side.file.name : 'Original Image';
}

/**
 * For rendering, we ideally want the settings that were used to create the
 * data, not the latest settings.
 */
function imgContain(side: Side) {
  const { resize } = (side.encodedSettings ?? side.latestSettings)
    .processorState;
  return resize.enabled && resize.fitMethod === 'contain';
}

const leftImgContain = computed(() => imgContain(sides[0]));
const rightImgContain = computed(() => imgContain(sides[1]));

function onRotate() {
  compressor.setRotation(
    ((preprocessorState.rotate.rotate + 90) % 360) as 0 | 90 | 180 | 270,
  );
}
</script>

<template>
  <div class="compress">
    <ImageOutput
      :source="source"
      :vertical="mobileView"
      :left-compressed="sides[0].data"
      :right-compressed="sides[1].data"
      :left-img-contain="leftImgContain"
      :right-img-contain="rightImgContain"
      @rotate="onRotate"
    />
    <button class="unbutton back" @click="emit('back')">
      <svg viewBox="0 0 61 53.3">
        <title>Back</title>
        <path
          class="back-blob"
          d="M0 25.6c-.5-7.1 4.1-14.5 10-19.1S23.4.1 32.2 0c8.8 0 19 1.6 24.4 8s5.6 17.8 1.7 27a29.7 29.7 0 01-20.5 18c-8.4 1.5-17.3-2.6-24.5-8S.5 32.6.1 25.6z"
        />
        <path
          class="back-x"
          d="M41.6 17.1l-2-2.1-8.3 8.2-8.2-8.2-2 2 8.2 8.3-8.3 8.2 2.1 2 8.2-8.1 8.3 8.2 2-2-8.2-8.3z"
        />
      </svg>
    </button>

    <div v-if="mobileView" class="options">
      <MultiPanel
        class="multi-panel"
        :count="2"
        :panel-classes="['options-1-theme', 'options-2-theme']"
      >
        <template v-for="index in [0, 1] as const" #[`heading-${index}`]>
          <ResultsBubble
            :download-url="sides[index].downloadUrl"
            :image-file="sides[index].file"
            :source="source"
            :loading="loading || sides[index].loading"
            :flip-side="true"
            :type-label="typeLabel(sides[index])"
          />
        </template>
        <template v-for="index in [0, 1] as const" #[`content-${index}`]>
          <OptionsPanel
            :side="sides[index]"
            :source="source"
            :can-import="hasSavedSettings[index]"
            @encoder-type-change="compressor.setEncoderType(index, $event)"
            @copy-to-other-side="compressor.copyToOtherSide(index)"
            @save-settings="compressor.saveSideSettings(index)"
            @import-settings="compressor.importSideSettings(index)"
          />
        </template>
      </MultiPanel>
    </div>
    <template v-else>
      <div
        v-for="index in [0, 1] as const"
        :key="index"
        :class="[
          'options',
          index === 0
            ? 'options-1 options-1-theme'
            : 'options-2 options-2-theme',
        ]"
      >
        <OptionsPanel
          :side="sides[index]"
          :source="source"
          :can-import="hasSavedSettings[index]"
          @encoder-type-change="compressor.setEncoderType(index, $event)"
          @copy-to-other-side="compressor.copyToOtherSide(index)"
          @save-settings="compressor.saveSideSettings(index)"
          @import-settings="compressor.importSideSettings(index)"
        />
        <ResultsBubble
          :download-url="sides[index].downloadUrl"
          :image-file="sides[index].file"
          :source="source"
          :loading="loading || sides[index].loading"
          :flip-side="index === 1"
          :type-label="typeLabel(sides[index])"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.compress {
  width: 100%;
  height: 100%;
  contain: strict;
  display: grid;
  grid-template-rows: max-content 1fr;
  grid-template-areas:
    'header'
    'opts';

  --options-radius: 7px;

  @media (min-width: 600px) {
    grid-template-rows: max-content 1fr;
    grid-template-columns: max-content 1fr max-content;
    grid-template-areas:
      'header header header'
      'optsLeft viewportOpts optsRight';
  }
}

.options {
  position: relative;
  color: #fff;
  font-size: 1.2rem;
  max-width: 400px;
  margin: 0 auto;
  width: calc(100% - 60px);
  max-height: 100%;
  overflow: hidden;
  grid-area: opts;
  display: grid;
  grid-template-rows: 1fr max-content;
  align-content: end;
  align-self: end;

  @media (min-width: 600px) {
    width: 300px;
    margin: 0;
  }
}

.options-1 {
  grid-area: optsLeft;
}

.options-2 {
  grid-area: optsRight;
}

.multi-panel {
  position: relative;
  display: flex;
  flex-flow: column;
  overflow: hidden;

  /* Reorder so headings appear after content: */
  & > :deep(:nth-child(1)) {
    order: 2;
    margin-bottom: 10px;
  }

  & > :deep(:nth-child(2)) {
    order: 1;
  }

  & > :deep(:nth-child(3)) {
    order: 4;
  }

  & > :deep(:nth-child(4)) {
    order: 3;
  }
}

.back {
  position: relative;
  grid-area: header;
  margin: 9px;
  justify-self: start;
  align-self: start;

  & > svg {
    width: 47px;
    overflow: visible;
  }

  &:focus .back-blob {
    stroke: var(--deep-blue);
    stroke-width: 5px;
    animation: strokePulse 500ms ease forwards;
  }

  @media (min-width: 600px) {
    margin: 14px;

    & > svg {
      width: 58px;
    }
  }
}

@keyframes strokePulse {
  from {
    stroke-width: 8px;
  }
  to {
    stroke-width: 5px;
  }
}

.back-blob {
  fill: var(--hot-pink);
  opacity: 0.77;
}

.back-x {
  fill: var(--white);
}
</style>
