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

type BrowserResizeMethods =
  | 'browser-pixelated'
  | 'browser-low'
  | 'browser-medium'
  | 'browser-high';
// These strings are persisted in localStorage, so they can't be renamed without
// stranding saved settings. 'lanczos3' predates the configurable radius, and
// keeps its name so that existing saved settings still resolve.
type WorkerResizeMethods =
  | 'triangle'
  | 'catrom'
  | 'mitchell'
  | 'lanczos3'
  | 'box'
  | 'hamming'
  | 'hqx';

export const workerResizeMethods: WorkerResizeMethods[] = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
  'box',
  'hamming',
  'hqx',
];

export type Options =
  | BrowserResizeOptions
  | WorkerResizeOptions
  | VectorResizeOptions;

export interface ResizeOptionsCommon {
  width: number;
  height: number;
  fitMethod: 'stretch' | 'contain';
  /**
   * Which part of the source survives the crop when fitMethod is 'contain'.
   * 0 keeps the left/top edge, 0.5 the middle, 1 the right/bottom edge.
   */
  centeringX: number;
  centeringY: number;
}

export interface BrowserResizeOptions extends ResizeOptionsCommon {
  method: BrowserResizeMethods;
}

export interface WorkerResizeOptions extends ResizeOptionsCommon {
  method: WorkerResizeMethods;
  premultiply: boolean;
  linearRGB: boolean;
  /** Radius of the Lanczos window, in source pixels. Only used by 'lanczos3'. */
  lanczosRadius: number;
}

export interface VectorResizeOptions extends ResizeOptionsCommon {
  method: 'vector';
}

export const defaultOptions: WorkerResizeOptions = {
  // Width and height will always default to the image size.
  // This is set elsewhere.
  width: 1,
  height: 1,
  // This will be set to 'vector' if the input is SVG.
  method: 'lanczos3',
  fitMethod: 'stretch',
  premultiply: true,
  linearRGB: true,
  lanczosRadius: 3,
  centeringX: 0.5,
  centeringY: 0.5,
};
