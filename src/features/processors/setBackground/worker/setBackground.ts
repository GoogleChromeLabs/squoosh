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
import { Options } from '../shared/meta';

interface ImageDataCanvas {
  getContext(contextId: '2d'): ImageDataCanvasRenderingContext2D | null;
}

interface ImageDataCanvasRenderingContext2D {
  fillStyle: string;
  globalCompositeOperation: string;
  fillRect(x: number, y: number, width: number, height: number): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
  putImageData(imageData: ImageData, dx: number, dy: number): void;
}

const { OffscreenCanvas } = globalThis as unknown as {
  // TypeScript 4.4's webworker lib has only an empty OffscreenCanvas type.
  OffscreenCanvas: new (width: number, height: number) => ImageDataCanvas;
};

export default async function setBackground(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  const canvas = new OffscreenCanvas(data.width, data.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw Error('Could not create canvas context');
  }

  ctx.putImageData(data, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillStyle = opts.background;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillRect(0, 0, data.width, data.height);

  return ctx.getImageData(0, 0, data.width, data.height);
}
