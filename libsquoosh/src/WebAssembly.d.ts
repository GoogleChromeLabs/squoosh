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
