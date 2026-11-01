export interface CacheResult {
  processed: ImageData;
  data: ImageData;
  file: File;
}

interface CacheEntry extends CacheResult {
  preprocessed: ImageData;
  /** Serialized processor and encoder settings, see `useCompressor`. */
  settingsKey: string;
}

const SIZE = 5;

/** A small LRU cache of encode results, keyed by source and settings. */
export default class ResultCache {
  private readonly _entries: CacheEntry[] = [];

  add(entry: CacheEntry) {
    // Add the new entry to the start
    this._entries.unshift(entry);
    // Remove the last entry if we're now bigger than SIZE
    if (this._entries.length > SIZE) this._entries.pop();
  }

  match(preprocessed: ImageData, settingsKey: string): CacheResult | undefined {
    const matchingIndex = this._entries.findIndex(
      (entry) =>
        entry.preprocessed === preprocessed &&
        entry.settingsKey === settingsKey,
    );

    if (matchingIndex === -1) return undefined;

    const matchingEntry = this._entries[matchingIndex];

    if (matchingIndex !== 0) {
      // Move the matched result to 1st position (LRU)
      this._entries.splice(matchingIndex, 1);
      this._entries.unshift(matchingEntry);
    }

    const { processed, data, file } = matchingEntry;
    return { processed, data, file };
  }
}
