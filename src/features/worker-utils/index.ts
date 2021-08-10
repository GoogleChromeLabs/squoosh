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

// @ts-ignore
self.asm = ''; // lol
// @ts-ignore
self.UTF32ToString = (...v) => console.log("u322s", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
// @ts-ignore
self.stringToUTF32 = (...v) => console.log("s2u32", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
// @ts-ignore
self.lengthBytesUTF32 = (...v) => console.log("lb32", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
// @ts-ignore
self.UTF16ToString = (...v) => console.log("u162s", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
// @ts-ignore
self.stringToUTF16 = (...v) => console.log("s2u16", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
// @ts-ignore
self.lengthBytesUTF16 = (...v) => console.log("lb16", v); //v => [...new Uint32Array(v)].map(v => String.fromCharCode(v)).join("")
export async function initEmscriptenModule<T extends EmscriptenWasm.Module>(
  moduleFactory: EmscriptenWasm.ModuleFactory<T>,
  wasmUrl: string,
  workerUrl?: string,
): Promise<T> {
  return moduleFactory({
    // @ts-ignore
    wasm: await fetch(wasmUrl).then(r => r.arrayBuffer()),
    // Just to be safe, don't automatically invoke any wasm functions
    noInitialRun: true,
    locateFile: (url: string) => {
      // This is probably unused?
      console.log("CALL TO LOCATEFILE", url);
      if (url.endsWith('.wasm')) return wasmUrl;
      if (url.endsWith('.worker.js')) return workerUrl!;
      throw Error('Unknown url in locateFile ' + url);
    },
  });
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Response(blob).arrayBuffer();
}
