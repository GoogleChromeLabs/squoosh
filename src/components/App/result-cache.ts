import { EncoderState } from '../../codecs/encoders';
import { shallowEqual } from '../../lib/util';
import { SourceImage } from '.';
import { PreprocessorState } from '../../codecs/preprocessors';

import * as identity from '../../codecs/identity/encoder';

interface CacheResult {
  preprocessed: ImageData;
  bmp: ImageBitmap;
  file: File;
}

interface CacheEntry extends CacheResult {
  preprocessorState: PreprocessorState;
  encoderState: EncoderState;
  source: SourceImage;
}

const SIZE = 5;

export default class ResultCache {
  private readonly _entries: CacheEntry[] = [];
  private _nextIndex: number = 0;

  add(entry: CacheEntry) {
    if (entry.encoderState.type === identity.type) throw Error('Cannot cache identity encodes');
    this._entries[this._nextIndex] = entry;
    this._nextIndex = (this._nextIndex + 1) % SIZE;
  }

  match(
    source: SourceImage,
    preprocessorState: PreprocessorState,
    encoderState: EncoderState,
  ): CacheResult | undefined {
    const matchingEntry = this._entries.find((entry) => {
      // Check for quick exits:
      if (entry.source !== source) return false;
      if (entry.encoderState.type !== encoderState.type) return false;

      // Check that each set of options in the preprocessor are the same
      for (const prop in preprocessorState) {
        if (
          !shallowEqual(
            (preprocessorState as any)[prop],
            (entry.preprocessorState as any)[prop],
          )
        ) return false;
      }

      // Check detailed encoder options
      if (!shallowEqual(encoderState.options, entry.encoderState.options)) return false;

      return true;
    });

    if (matchingEntry) {
      return {
        bmp: matchingEntry.bmp,
        preprocessed: matchingEntry.preprocessed,
        file: matchingEntry.file,
      };
    }

    return undefined;
  }
}
