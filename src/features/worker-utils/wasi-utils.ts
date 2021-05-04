/**
 * Copyright 2021 Google Inc. All Rights Reserved.
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

export function makeEverythingElseThrow(obj: { [x: string]: {} }): {} {
  return new Proxy(obj, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop];
      }
      return () => {
        throw Error(`${prop} not implemented`);
      };
    },
  });
}

export function makeWasiEnv() {
  return {
    environ_sizes_get: () => 0,
    environ_get: () => 0,
  };
}
