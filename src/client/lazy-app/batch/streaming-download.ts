import { makeZip, downloadZip } from 'client-zip';
import { BatchItem } from './types';
import { BatchStore } from './batch-store';

export interface DownloadProgress {
  current: number;
  total: number;
  filename: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

async function* createZipEntries(
  items: BatchItem[],
  onProgress?: ProgressCallback,
): AsyncGenerator<{ name: string; input: Blob; lastModified: Date }> {
  const completedItems = items.filter((item) => item.status === 'completed' && item.compressedFile);
  const total = completedItems.length;
  let current = 0;

  for (const item of completedItems) {
    if (!item.compressedFile) continue;

    current++;
    onProgress?.({
      current,
      total,
      filename: item.compressedFile.name,
    });

    yield {
      name: item.compressedFile.name,
      input: item.compressedFile,
      lastModified: new Date(),
    };

    await 0;
  }
}

export async function createZipStream(
  items: BatchItem[],
  onProgress?: ProgressCallback,
): Promise<ReadableStream<Uint8Array>> {
  const entries = createZipEntries(items, onProgress);
  return makeZip(entries);
}

export async function downloadAllAsZip(
  items: BatchItem[],
  filename: string = 'compressed-images.zip',
  onProgress?: ProgressCallback,
): Promise<void> {
  const entries = createZipEntries(items, onProgress);
  const response = downloadZip(entries);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function streamZipToDownload(
  items: BatchItem[],
  filename: string = 'compressed-images.zip',
  onProgress?: ProgressCallback,
): Promise<void> {
  return downloadAllAsZip(items, filename, onProgress);
}

export async function createStreamingZipDownload(
  store: BatchStore,
  filename: string = 'compressed-images.zip',
  onProgress?: ProgressCallback,
): Promise<void> {
  const items = store.getItems();
  return downloadAllAsZip(items, filename, onProgress);
}

export function getCompletedItems(items: BatchItem[]): BatchItem[] {
  return items.filter((item) => item.status === 'completed' && item.compressedFile);
}

export function hasCompressedItems(items: BatchItem[]): boolean {
  return getCompletedItems(items).length > 0;
}
