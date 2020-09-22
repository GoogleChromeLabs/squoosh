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
import { wrap } from 'comlink';
import workerURL from 'omt:features/worker';
import imgURL from 'url:./tmp.png';

import type { ProcessorWorkerApi } from 'features/worker';
const worker = new Worker(workerURL);
const api = wrap<ProcessorWorkerApi>(worker);

async function demo() {
  const img = document.createElement('img');
  img.src = imgURL;
  await img.decode();
  // Make canvas same size as image
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  const result = await api.rotate(data, {
    rotate: 180,
  });

  {
    /*const resultUrl = URL.createObjectURL(new Blob([result]));
    const img = new Image();
    img.src = resultUrl;
    document.body.append(img);*/

    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(result, 0, 0);
    document.body.append(canvas);
  }
}

demo();
