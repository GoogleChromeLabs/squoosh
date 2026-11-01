<script lang="ts">
import { ref } from 'vue';
import { konami } from '@/lib/util';

// The ZX palette is an easter egg, shown once the Konami code is typed.
const extendedSettings = ref(false);
konami().then(() => (extendedSettings.value = true));
</script>

<script setup lang="ts">
import Expander from '@/components/controls/Expander.vue';
import Range from '@/components/controls/Range.vue';
import Select from '@/components/controls/Select.vue';
import type { Options } from './meta';

const options = defineModel<Options>({ required: true });
</script>

<template>
  <form class="options-section" @submit.prevent>
    <Expander>
      <label v-if="extendedSettings" class="option-text-first">
        Type:
        <Select v-model="options.zx">
          <option :value="0">Standard</option>
          <option :value="1">ZX</option>
        </Select>
      </label>
    </Expander>
    <Expander>
      <div v-if="!options.zx" class="option-one-cell">
        <Range v-model="options.maxNumColors" :min="2" :max="256">
          Colors:
        </Range>
      </div>
    </Expander>
    <div class="option-one-cell">
      <Range v-model="options.dither" :min="0" :max="1" :step="0.01">
        Dithering:
      </Range>
    </div>
  </form>
</template>
