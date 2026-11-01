<!-- Processor and encoder settings for one side. -->
<script setup lang="ts">
import { computed } from 'vue';
import Expander from '@/components/controls/Expander.vue';
import Select from '@/components/controls/Select.vue';
import Toggle from '@/components/controls/Toggle.vue';
import { ImportIcon, SaveIcon, SwapIcon } from '@/components/icons';
import type {
  OutputType,
  Side,
  SourceImage,
} from '@/composables/useCompressor';
import { encoderOptionsComponents } from '@/features/options-components';
import { encoderMap } from '@/features/registry';
import QuantizeOptions from '@/features/processors/quantize/Options.vue';
import ResizeOptions from '@/features/processors/resize/Options.vue';

const props = defineProps<{
  side: Side;
  source?: SourceImage;
  /** Whether this side has saved settings to import. */
  canImport: boolean;
}>();

const emit = defineEmits<{
  encoderTypeChange: [type: OutputType];
  copyToOtherSide: [];
  saveSettings: [];
  importSettings: [];
}>();

const settings = computed(() => props.side.latestSettings);

const encoderType = computed({
  get: (): OutputType => settings.value.encoderState?.type ?? 'identity',
  set: (type) => emit('encoderTypeChange', type),
});

const encoderOptionsComponent = computed(
  () =>
    settings.value.encoderState &&
    encoderOptionsComponents[settings.value.encoderState.type],
);
</script>

<template>
  <div
    :class="['options-scroller', { 'original-image': !settings.encoderState }]"
  >
    <Expander>
      <div v-if="settings.encoderState">
        <h3 class="options-title">
          <div class="title-and-buttons">
            Edit
            <button
              class="unbutton title-button copy-over-button"
              title="Copy settings to other side"
              @click="emit('copyToOtherSide')"
            >
              <SwapIcon />
            </button>
            <button
              class="unbutton title-button save-button"
              title="Save side settings"
              @click="emit('saveSettings')"
            >
              <SaveIcon />
            </button>
            <button
              :class="[
                'unbutton title-button import-button',
                { 'button-opacity': !canImport },
              ]"
              title="Import saved side settings"
              :disabled="!canImport"
              @click="emit('importSettings')"
            >
              <ImportIcon />
            </button>
          </div>
        </h3>
        <label class="section-enabler">
          Resize
          <Toggle v-model="settings.processorState.resize.enabled" />
        </label>
        <Expander>
          <ResizeOptions
            v-if="settings.processorState.resize.enabled"
            v-model="settings.processorState.resize"
            :is-vector="!!source?.vectorImage"
            :input-width="source ? source.preprocessed.width : 1"
            :input-height="source ? source.preprocessed.height : 1"
          />
        </Expander>

        <label class="section-enabler">
          Reduce palette
          <Toggle v-model="settings.processorState.quantize.enabled" />
        </label>
        <Expander>
          <QuantizeOptions
            v-if="settings.processorState.quantize.enabled"
            v-model="settings.processorState.quantize"
          />
        </Expander>
      </div>
    </Expander>

    <h3 class="options-title">Compress</h3>

    <section class="option-one-cell options-section">
      <Select v-model="encoderType" large>
        <option value="identity">
          Original Image {{ source ? `(${source.file.name})` : '' }}
        </option>
        <option v-for="(encoder, type) in encoderMap" :key="type" :value="type">
          {{ encoder.meta.label }}
        </option>
      </Select>
    </section>

    <Expander>
      <!-- Keyed inside a stable wrapper, so switching between two encoders
           with options swaps the panel without animating. -->
      <div v-if="encoderOptionsComponent">
        <component
          :is="encoderOptionsComponent"
          :key="settings.encoderState!.type"
          v-model="settings.encoderState!.options"
        />
      </div>
    </Expander>
  </div>
</template>
