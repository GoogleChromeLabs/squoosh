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

import { EncoderState, ProcessorState } from '../feature-meta';

// Maps our encoder.type values to CLI parameter names
const typeMap = new Map<string, string>([
  ['avif', '--avif'],
  ['jxl', '--jxl'],
  ['mozJPEG', '--mozjpeg'],
  ['oxiPNG', '--oxipng'],
  ['webP', '--webp'],
  ['wp2', '--wp2'],
]);

// Same as JSON.stringify, but with single quotes around the entire value
// so that shells don’t do weird stuff.
function cliJson<T>(v: T): string {
  return "'" + JSON.stringify(v) + "'";
}

export function generateCliInvocation(
  encoder: EncoderState,
  processor: ProcessorState,
): string {
  if (!typeMap.has(encoder.type)) {
    throw Error(`Encoder ${encoder.type} is unsupported in the CLI`);
  }
  return [
    'npx',
    '@squoosh/cli',
    ...(processor.resize.enabled
      ? ['--resize', cliJson(processor.resize)]
      : []),
    ...(processor.quantize.enabled
      ? ['--quant', cliJson(processor.quantize)]
      : []),
    typeMap.get(encoder.type)!,
    cliJson(encoder.options),
  ].join(' ');
}
