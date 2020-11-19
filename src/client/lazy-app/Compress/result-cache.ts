import { EncoderState, ProcessorState } from '../feature-meta';
import { shallowEqual } from '../util';

interface CacheResult {
  processed: ImageData;
  data: ImageData;
  file: File;
}

interface CacheEntry extends CacheResult {
  processorState: ProcessorState;
  encoderState: EncoderState;
  preprocessed: ImageData;
}

const SIZE = 5;

export default class ResultCache {
  private readonly _entries: CacheEntry[] = [];

  add(entry: CacheEntry) {
    // Add the new entry to the start
    this._entries.unshift(entry);
    // Remove the last entry if we're now bigger than SIZE
    if (this._entries.length > SIZE) this._entries.pop();
  }

  match(
    preprocessed: ImageData,
    processorState: ProcessorState,
    encoderState: EncoderState,
  ): CacheResult | undefined {
    const matchingIndex = this._entries.findIndex((entry) => {
      // Check for quick exits:
      if (entry.preprocessed !== preprocessed) return false;
      if (entry.encoderState.type !== encoderState.type) return false;

      // Check that each set of options in the preprocessor are the same
      for (const prop in processorState) {
        if (
          !shallowEqual(
            (processorState as any)[prop],
            (entry.processorState as any)[prop],
          )
        ) {
          return false;
        }
      }

      // Check detailed encoder options
      if (!shallowEqual(encoderState.options, entry.encoderState.options)) {
        return false;
      }

      return true;
    });

    if (matchingIndex === -1) return undefined;

    const matchingEntry = this._entries[matchingIndex];

    if (matchingIndex !== 0) {
      // Move the matched result to 1st position (LRU)
      this._entries.splice(matchingIndex, 1);
      this._entries.unshift(matchingEntry);
    }

    return { ...matchingEntry };
  }
}
