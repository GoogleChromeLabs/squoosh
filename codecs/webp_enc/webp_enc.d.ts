import { EncodeOptions } from '../../src/codecs/webp/encoder';

interface WebPModule extends EmscriptenWasm.Module {
  create_buffer(width: number, height: number): number;
  encode(pointer: number, width: number, height: number, options: EncodeOptions): void;
  get_result_pointer(): number;
  get_result_size(): number;
  free_result(): void;
  destroy_buffer(pointer: number): void;
}


export default function(opts: EmscriptenWasm.ModuleOpts): WebPModule;
