/// <reference path="../../missing-types.d.ts" />

declare module 'asset-url:*' {
  const value: string;
  export default value;
}

// Somehow TS picks up definitions from the module itself
// instead of using `asset-url:*`. It is probably related to
// specifity of the module declaration and these declarations below fix it
declare module 'asset-url:../../codecs/png/pkg/squoosh_png_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'asset-url:../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm' {
  const value: string;
  export default value;
}

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
