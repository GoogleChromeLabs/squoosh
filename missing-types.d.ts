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
/// <reference path="./emscripten-types.d.ts" />

declare module 'entry-data:*' {
  export const main: string;
  export const deps: string[];
}

declare module 'url:*' {
  const value: string;
  export default value;
}

declare module 'img-url:*' {
  const value: string;
  export default value;
  export const width: number;
  export const height: number;
}

declare module 'omt:*' {
  const value: string;
  export default value;
}

declare module 'css:*' {
  const source: string;
  export default source;
}

declare module 'data-url:*' {
  const url: string;
  export default url;
}

declare module 'service-worker:*' {
  const url: string;
  export default url;
}

declare var ga: {
  (...args: any[]): void;
  q: any[];
};

declare const __PRODUCTION__: boolean;
