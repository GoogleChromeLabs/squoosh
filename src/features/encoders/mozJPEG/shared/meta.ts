/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  EncodeOptions,
  MozJpegColorSpace,
} from 'codecs/mozjpeg/enc/mozjpeg_enc';
export { EncodeOptions, MozJpegColorSpace };

export const label = 'MozJPEG';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: MozJpegColorSpace.YCbCr,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
  auto_subsample: true,
  chroma_subsample: 2,
  separate_chroma_quality: false,
  chroma_quality: 75,
};

/**
 * Simple helper function that wraps each line of the input at `line_width` characters (default 60)
 */
function wrapText(text: string, line_width: number = 60): string {
  const lines = text.split('\n');
  let balancedText = '';
  for (const line of lines) {
    balancedText += '\n';
    const words = line.split(' ');
    let runningLength = 0;
    for (const word of words) {
      if (runningLength + word.length + 1 > line_width) {
        balancedText += '\n' + word + ' ';
        runningLength = word.length;
      } else {
        runningLength += word.length + 1;
        balancedText += word + ' ';
      }
    }
  }
  return balancedText.trim();
}

// Until we make a better way of displaying information (like with modals), displaying a simple 'title' attribute should suffice for each codec parameter
type mozjpeg_param = keyof typeof defaultOptions;
const paramDescriptions: Record<mozjpeg_param, string> = {
  quality:
    'Trade-off between compressed file size and image quality\nHigher quality means larger file sizes',
  baseline:
    "Ensures strict complicance with JPEG specifications, but disables progressive coding\nMost browsers do not require this, but it's necessary at very low quality values",
  arithmetic:
    '(NOT WIDELY SUPPORTED)\nUses Arithmetic instead of Huffman Encoding', // Not gonna be displayed but oh well
  progressive:
    'Tells browsers to render the image progressively\nThe rendered image goes from blurry to normal quality with each scan\nOften results in greater compression',
  optimize_coding:
    'When enabled, compressed file size is minimized\nWhen disabled, encoding time is minimized\nDoes not affect image quality or decoding speed',
  smoothing:
    'Smooths the original image to eliminate dithering noise\nEliminates fine-scale noise, but large smoothing values may blur the image',
  color_space: 'Choose among color spaces to operate on (default YCbCr)',
  // TODO: Explain which color space each quant table set has been developed for
  quant_table:
    'Choose among sets of quantization tables for the color space channels',
  trellis_multipass:
    'Applies trellis quantization\nThis changes the quantization table to obtain the best rate-distortion metric',
  trellis_opt_zero: 'Optimizes runs of zero blocks after the trellis multipass',
  trellis_opt_table:
    'A revised quantization table will be derived to minimize reconstruction error of the quantized coefficients',
  trellis_loops:
    'Sets the number of trellis quantization passes\nHuffman tables are updated between passes',
  auto_subsample:
    'When enabled, horizontal and vertical chroma subsampling factors are chosen automatically\nWhen disabled, you can choose a custom subsampling factor',
  chroma_subsample:
    'Sets the horizontal and vertical chroma subsampling factors',
  separate_chroma_quality:
    'When enabled, you can choose a custom quality of preserved chroma\nWhen disabled, a chroma quality of 75% is chosen automatically',
  chroma_quality:
    'Sets the quality of preserved chroma in the compressed image',
};
export const getParameterDescription = (param: mozjpeg_param): string => {
  if (!(param in paramDescriptions)) return '';
  // Return the description (wrapped at 60ch)
  return wrapText(paramDescriptions[param]);
};
