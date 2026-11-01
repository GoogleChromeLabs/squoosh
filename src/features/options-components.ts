import type { Component } from 'vue';
import type { EncoderType } from './registry';
import AvifOptions from './encoders/avif/Options.vue';
import BrowserQualityOptions from './encoders/BrowserQualityOptions.vue';
import JxlOptions from './encoders/jxl/Options.vue';
import MozJpegOptions from './encoders/mozJPEG/Options.vue';
import OxiPngOptions from './encoders/oxiPNG/Options.vue';
import WebPOptions from './encoders/webP/Options.vue';

/**
 * Options panel for each encoder, used with `v-model` on the encoder's
 * options. Browser PNG and QOI have no options.
 */
export const encoderOptionsComponents: Partial<Record<EncoderType, Component>> =
  {
    avif: AvifOptions,
    browserAVIF: BrowserQualityOptions,
    browserJPEG: BrowserQualityOptions,
    browserWebP: BrowserQualityOptions,
    jxl: JxlOptions,
    mozJPEG: MozJpegOptions,
    oxiPNG: OxiPngOptions,
    webP: WebPOptions,
  };
