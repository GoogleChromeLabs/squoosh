import { EncoderState } from '../../codecs/encoders';
import { Fileish } from '../../lib/initial-util';
import { shallowEqual } from '../../lib/util';
import { PreprocessorState } from '../../codecs/preprocessors';

import * as identity from '../../codecs/identity/encoder-meta';

interface CacheResult {
  preprocessed: ImageData;
  data: ImageData;
  file: Fileish;
}

interface CacheEntry extends CacheResult {
  preprocessorState: PreprocessorState;
  encoderState: EncoderState;
  sourceData: ImageData;
}

const SIZE = 5;

export default class ResultCache {
  private readonly _entries: CacheEntry[] = [];

  add(entry: CacheEntry) {
    if (entry.encoderState.type === identity.type) throw Error('Cannot cache identity encodes');
    // Add the new entry to the start
    this._entries.unshift(entry);
    // Remove the last entry if we're now bigger than SIZE
    if (this._entries.length > SIZE) this._entries.pop();
  }

  match(
    sourceData: ImageData,
    preprocessorState: PreprocessorState,
    encoderState: EncoderState,
  ): CacheResult | undefined {
    const matchingIndex = this._entries.findIndex((entry) => {
      // Check for quick exits:
      if (entry.sourceData !== sourceData) return false;
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

    if (matchingIndex === -1) return undefined;

    const matchingEntry = this._entries[matchingIndex];

    if (matchingIndex !== 0) {
      // Move the matched result to 1st position (LRU)
      this._entries.splice(matchingIndex, 1);
      this._entries.unshift(matchingEntry);
    }

    return {
      data: matchingEntry.data,
      preprocessed: matchingEntry.preprocessed,
      file: matchingEntry.file,
    };
  }
}
