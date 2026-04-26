import { BatchItem, BatchStats, BatchItemStatus } from './types';
import { ProcessOptions, BatchProcessor, defaultBatchProcessor } from './batch-processor';
import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
  defaultPreprocessorState,
  defaultProcessorState,
} from '../feature-meta';

export interface BatchStoreConfig {
  processor: BatchProcessor;
}

export const DEFAULT_BATCH_STORE_CONFIG: BatchStoreConfig = {
  processor: defaultBatchProcessor,
};

export interface GlobalSettings {
  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

type StoreListener = () => void;

export class BatchStore {
  private config: BatchStoreConfig;
  private items: Map<string, BatchItem> = new Map();
  private itemOrder: string[] = [];
  private listeners: Set<StoreListener> = new Set();
  private globalSettings: GlobalSettings = {
    preprocessorState: { ...defaultPreprocessorState },
    processorState: { ...defaultProcessorState },
    encoderState: undefined,
  };
  private isProcessing: boolean = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<BatchStoreConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_STORE_CONFIG, ...config };
  }

  get processor(): BatchProcessor {
    return this.config.processor;
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getItems(): BatchItem[] {
    return this.itemOrder.map((id) => this.items.get(id)!).filter(Boolean);
  }

  getItem(id: string): BatchItem | undefined {
    return this.items.get(id);
  }

  getGlobalSettings(): GlobalSettings {
    return { ...this.globalSettings };
  }

  getStats(): BatchStats {
    let total = 0;
    let pending = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const item of this.items.values()) {
      total++;
      totalOriginalSize += item.file.size;

      if (item.compressedFile) {
        totalCompressedSize += item.compressedFile.size;
      }

      switch (item.status) {
        case 'pending':
          pending++;
          break;
        case 'decoding':
        case 'preprocessing':
        case 'processing':
        case 'encoding':
          active++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      total,
      pending,
      active,
      completed,
      failed,
      totalOriginalSize,
      totalCompressedSize,
    };
  }

  getOverallProgress(): number {
    const stats = this.getStats();
    if (stats.total === 0) return 0;
    return (stats.completed + stats.failed) / stats.total;
  }

  setGlobalSettings(settings: Partial<GlobalSettings>): void {
    this.globalSettings = {
      ...this.globalSettings,
      ...settings,
    };
    this.notify();
  }

  applyGlobalSettingsToAll(): void {
    for (const [id, item] of this.items) {
      this.items.set(id, {
        ...item,
        preprocessorState: { ...this.globalSettings.preprocessorState },
        processorState: { ...this.globalSettings.processorState },
        encoderState: this.globalSettings.encoderState
          ? { ...this.globalSettings.encoderState }
          : undefined,
      });
    }
    this.notify();
  }

  addFiles(files: File[]): string[] {
    const newIds: string[] = [];

    for (const file of files) {
      const item = this.processor.createBatchItem(file, {
        preprocessorState: { ...this.globalSettings.preprocessorState },
        processorState: { ...this.globalSettings.processorState },
        encoderState: this.globalSettings.encoderState
          ? { ...this.globalSettings.encoderState }
          : undefined,
      });

      this.items.set(item.id, item);
      this.itemOrder.push(item.id);
      newIds.push(item.id);
    }

    this.notify();
    return newIds;
  }

  removeItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;

    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }

    this.items.delete(id);
    const index = this.itemOrder.indexOf(id);
    if (index !== -1) {
      this.itemOrder.splice(index, 1);
    }

    this.notify();
    return true;
  }

  clearCompleted(): void {
    const toRemove: string[] = [];

    for (const [id, item] of this.items) {
      if (item.status === 'completed') {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeItem(id);
    }
  }

  clearAll(): void {
    for (const item of this.items.values()) {
      if (item.downloadUrl) {
        URL.revokeObjectURL(item.downloadUrl);
      }
    }

    this.items.clear();
    this.itemOrder = [];
    this.notify();
  }

  updateItemStatus(
    id: string,
    updates: Partial<Pick<BatchItem, 'status' | 'progress' | 'error'>>,
  ): void {
    const item = this.items.get(id);
    if (!item) return;

    this.items.set(id, {
      ...item,
      ...updates,
    });

    this.notify();
  }

  async retryItem(id: string): Promise<void> {
    const item = this.items.get(id);
    if (!item || item.status !== 'failed') return;

    if (item.retryCount >= item.maxRetries) {
      throw new Error('Max retries exceeded');
    }

    this.items.set(id, {
      ...item,
      status: 'pending',
      progress: 0,
      retryCount: item.retryCount + 1,
      error: undefined,
    });

    this.notify();
  }

  private async processItemInternal(item: BatchItem): Promise<BatchItem> {
    const processed = await this.processor.processItem(
      item,
      (status, progress) => {
        this.updateItemStatus(item.id, { status, progress });
      },
    );

    this.items.set(item.id, processed);
    this.notify();

    return processed;
  }

  async processAll(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.abortController = new AbortController();
    this.notify();

    try {
      const pendingItems = this.getItems().filter((item) => item.status === 'pending');

      for (const item of pendingItems) {
        if (this.abortController?.signal.aborted) break;
        await this.processItemInternal(item);
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
      this.notify();
    }
  }

  async processConcurrently(maxConcurrent: number = 4): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.abortController = new AbortController();
    this.notify();

    const pendingItems = [...this.getItems().filter((item) => item.status === 'pending')];
    let index = 0;
    const activePromises: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      while (index < pendingItems.length && !this.abortController?.signal.aborted) {
        const item = pendingItems[index++];
        await this.processItemInternal(item);
      }
    };

    for (let i = 0; i < Math.min(maxConcurrent, pendingItems.length); i++) {
      activePromises.push(processNext());
    }

    try {
      await Promise.all(activePromises);
    } finally {
      this.isProcessing = false;
      this.abortController = null;
      this.notify();
    }
  }

  stopProcessing(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const defaultBatchStore = new BatchStore();
