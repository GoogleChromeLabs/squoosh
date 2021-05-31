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
/// <reference path="../../missing-types.d.ts" />

// These don't exist in NodeJS types so we're not able to use them but they are referenced in some emscripten and codec types
// Thus, we need to explicitly assign them to be `never`
// We're also not able to use the APIs that use these types
// So, if we want to use those APIs we need to supply its dependencies ourselves
// However, probably those APIs are more suited to be used in web (i.e. there can be other
// dependencies to web APIs that might not work in Node)
type RequestInfo = never;
type Response = never;
type WebGLRenderingContext = never;
type MessageEvent = never;

type BufferSource = ArrayBufferView | ArrayBuffer;
type URL = import('url').URL;

/*
 * Matches the implementation in `image_data.ts` which is exposed to globalThis
 */
interface ImageData {
  /**
   * Returns the one-dimensional array containing the data in RGBA order, as integers in the range 0 to 255.
   */
  readonly data: Uint8ClampedArray;
  /**
   * Returns the actual dimensions of the data in the ImageData object, in pixels.
   */
  readonly height: number;
  /**
   * Returns the actual dimensions of the data in the ImageData object, in pixels.
   */
  readonly width: number;
}

/**
 * WebAssembly definitions are not available in `@types/node` yet,
 * so these are copied from `lib.dom.d.ts`
 */
declare namespace WebAssembly {
  interface CompileError {}

  var CompileError: {
    prototype: CompileError;
    new (): CompileError;
  };

  interface Global {
    value: any;
    valueOf(): any;
  }

  var Global: {
    prototype: Global;
    new (descriptor: GlobalDescriptor, v?: any): Global;
  };

  interface Instance {
    readonly exports: Exports;
  }

  var Instance: {
    prototype: Instance;
    new (module: Module, importObject?: Imports): Instance;
  };

  interface LinkError {}

  var LinkError: {
    prototype: LinkError;
    new (): LinkError;
  };

  interface Memory {
    readonly buffer: ArrayBuffer;
    grow(delta: number): number;
  }

  var Memory: {
    prototype: Memory;
    new (descriptor: MemoryDescriptor): Memory;
  };

  interface Module {}

  var Module: {
    prototype: Module;
    new (bytes: BufferSource): Module;
    customSections(moduleObject: Module, sectionName: string): ArrayBuffer[];
    exports(moduleObject: Module): ModuleExportDescriptor[];
    imports(moduleObject: Module): ModuleImportDescriptor[];
  };

  interface RuntimeError {}

  var RuntimeError: {
    prototype: RuntimeError;
    new (): RuntimeError;
  };

  interface Table {
    readonly length: number;
    get(index: number): Function | null;
    grow(delta: number): number;
    set(index: number, value: Function | null): void;
  }

  var Table: {
    prototype: Table;
    new (descriptor: TableDescriptor): Table;
  };

  interface GlobalDescriptor {
    mutable?: boolean;
    value: ValueType;
  }

  interface MemoryDescriptor {
    initial: number;
    maximum?: number;
  }

  interface ModuleExportDescriptor {
    kind: ImportExportKind;
    name: string;
  }

  interface ModuleImportDescriptor {
    kind: ImportExportKind;
    module: string;
    name: string;
  }

  interface TableDescriptor {
    element: TableKind;
    initial: number;
    maximum?: number;
  }

  interface WebAssemblyInstantiatedSource {
    instance: Instance;
    module: Module;
  }

  type ImportExportKind = 'function' | 'global' | 'memory' | 'table';
  type TableKind = 'anyfunc';
  type ValueType = 'f32' | 'f64' | 'i32' | 'i64';
  type ExportValue = Function | Global | Memory | Table;
  type Exports = Record<string, ExportValue>;
  type ImportValue = ExportValue | number;
  type ModuleImports = Record<string, ImportValue>;
  type Imports = Record<string, ModuleImports>;
  function compile(bytes: BufferSource): Promise<Module>;
  // `compileStreaming` does not exist in NodeJS
  // function compileStreaming(source: Response | Promise<Response>): Promise<Module>;
  function instantiate(
    bytes: BufferSource,
    importObject?: Imports,
  ): Promise<WebAssemblyInstantiatedSource>;
  function instantiate(
    moduleObject: Module,
    importObject?: Imports,
  ): Promise<Instance>;
  // `instantiateStreaming` does not exist in NodeJS
  // function instantiateStreaming(response: Response | PromiseLike<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
  function validate(bytes: BufferSource): boolean;
}
