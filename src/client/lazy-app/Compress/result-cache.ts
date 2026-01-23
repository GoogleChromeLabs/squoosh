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
  timestamp: number;
  sizeMB: number;
}

const MAX_MEMORY_MB = 150; // Maximum cache size in MB
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes TTL

export default class ResultCache {
  private readonly _entries = new Map<string, CacheEntry>();
  private _currentMemoryMB = 0;

  private _calculateSizeMB(imageData: ImageData): number {
    // RGBA = 4 bytes per pixel
    const bytes = imageData.width * imageData.height * 4;
    return bytes / (1024 * 1024);
  }

  private _generateKey(
    preprocessed: ImageData,
    processorState: ProcessorState,
    encoderState: EncoderState,
  ): string {
    const stateHash = JSON.stringify({
      processor: processorState,
      encoder: { type: encoderState.type, options: encoderState.options },
    });
    const dataId = preprocessed.data.byteLength + preprocessed.width + preprocessed.height;
    return `${dataId}-${stateHash}`;
  }

  private _evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this._entries) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this._entries.get(oldestKey)!;
      this._currentMemoryMB -= entry.sizeMB;
      this._entries.delete(oldestKey);
    }
  }

  private _cleanExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this._entries) {
      if (now - entry.timestamp > MAX_AGE_MS) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      const entry = this._entries.get(key)!;
      this._currentMemoryMB -= entry.sizeMB;
      this._entries.delete(key);
    }
  }

  add(entry: CacheEntry) {
    this._cleanExpired();

    const key = this._generateKey(entry.preprocessed, entry.processorState, entry.encoderState);

    const sizeMB =
      this._calculateSizeMB(entry.preprocessed) +
      this._calculateSizeMB(entry.processed) +
      this._calculateSizeMB(entry.data);

    // Evict until we have enough space
    while (this._currentMemoryMB + sizeMB > MAX_MEMORY_MB && this._entries.size > 0) {
      this._evictOldest();
    }

    if (sizeMB > MAX_MEMORY_MB) {
      console.warn('Cache entry too large, skipping:', sizeMB, 'MB');
      return;
    }

    this._entries.set(key, { ...entry, timestamp: Date.now(), sizeMB });
    this._currentMemoryMB += sizeMB;
  }

  match(
    preprocessed: ImageData,
    processorState: ProcessorState,
    encoderState: EncoderState,
  ): CacheResult | undefined {
    this._cleanExpired();

    const key = this._generateKey(preprocessed, processorState, encoderState);
    const entry = this._entries.get(key);

    if (!entry) return undefined;
    if (entry.preprocessed !== preprocessed) return undefined;
    if (entry.encoderState.type !== encoderState.type) return undefined;

    for (const prop in processorState) {
      if (!shallowEqual((processorState as any)[prop], (entry.processorState as any)[prop])) {
        return undefined;
      }
    }

    if (!shallowEqual(encoderState.options, entry.encoderState.options)) return undefined;

    entry.timestamp = Date.now();
    return { processed: entry.processed, data: entry.data, file: entry.file };
  }

  clear(): void {
    this._entries.clear();
    this._currentMemoryMB = 0;
  }

  getStats() {
    return {
      entries: this._entries.size,
      memoryMB: this._currentMemoryMB.toFixed(2),
      maxMemoryMB: MAX_MEMORY_MB,
    };
  }
}
