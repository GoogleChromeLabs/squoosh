import { h, Component } from 'preact';
import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/loading-spinner';
import BatchItemCard from './BatchItemCard';
import { BatchStore, defaultBatchStore, GlobalSettings } from '../batch/batch-store';
import { BatchItem, BatchStats, BatchItemStatus } from '../batch/types';
import {
  encoderMap,
  EncoderType,
  EncoderState,
  defaultPreprocessorState,
  defaultProcessorState,
} from '../feature-meta';
import {
  createStreamingZipDownload,
  hasCompressedItems,
  getCompletedItems,
} from '../batch/streaming-download';
import {
  BackIcon,
  ImageIcon,
  UploadIcon,
  PlayIcon,
  StopIcon,
  DownloadIcon,
  TrashIcon,
  SettingsIcon,
} from 'client/lazy-app/icons';

interface Props {
  showSnack: SnackBarElement['showSnackbar'];
  onBack: () => void;
  onSwitchToSingle: (file: File) => void;
}

interface State {
  store: BatchStore;
  items: BatchItem[];
  stats: BatchStats;
  isProcessing: boolean;
  overallProgress: number;
  globalSettings: GlobalSettings;
}

function getEncoderOptions(): { label: string; value: EncoderType }[] {
  return [
    { label: 'Original', value: 'mozJPEG' as EncoderType },
    ...Object.entries(encoderMap).map(([key, value]) => ({
      label: value.meta.label,
      value: key as EncoderType,
    })),
  ];
}

export default class BatchCompress extends Component<Props, State> {
  state: State = {
    store: defaultBatchStore,
    items: [],
    stats: {
      total: 0,
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
    },
    isProcessing: false,
    overallProgress: 0,
    globalSettings: {
      preprocessorState: { ...defaultPreprocessorState },
      processorState: { ...defaultProcessorState },
      encoderState: {
        type: 'mozJPEG',
        options: { ...encoderMap.mozJPEG.meta.defaultOptions },
      },
    },
  };

  private unsubscribeStore: (() => void) | null = null;
  private fileInput: HTMLInputElement | null = null;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount(): void {
    this.unsubscribeStore = this.state.store.subscribe(() => {
      this.updateFromStore();
    });
    this.updateFromStore();
  }

  componentWillUnmount(): void {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }

  private updateFromStore = (): void => {
    const { store } = this.state;
    this.setState({
      items: store.getItems(),
      stats: store.getStats(),
      isProcessing: store.getIsProcessing(),
      overallProgress: store.getOverallProgress(),
      globalSettings: store.getGlobalSettings(),
    });
  };

  private handleFilesAdded = (files: FileList | File[]): void => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (fileArray.length === 0) {
      this.props.showSnack('No valid image files selected', { timeout: 3000 });
      return;
    }

    const ids = this.state.store.addFiles(fileArray);
    this.props.showSnack(`Added ${ids.length} image(s)`, { timeout: 2000 });
  };

  private onFileDrop = ({ files }: FileDropEvent): void => {
    if (!files || files.length === 0) return;
    this.handleFilesAdded(files);
  };

  private onFileInputChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFilesAdded(input.files);
    }
  };

  private handleEncoderChange = (e: Event): void => {
    const select = e.target as HTMLSelectElement;
    const encoderType = select.value as EncoderType;

    const encoderState = {
      type: encoderType,
      options: { ...encoderMap[encoderType].meta.defaultOptions },
    } as EncoderState;

    const newSettings: GlobalSettings = {
      ...this.state.globalSettings,
      encoderState,
    };

    this.state.store.setGlobalSettings(newSettings);
  };

  private handleApplySettings = (): void => {
    this.state.store.applyGlobalSettingsToAll();
    this.props.showSnack('Settings applied to all images', { timeout: 2000 });
  };

  private handleStartProcessing = async (): Promise<void> => {
    const { store } = this.state;
    if (store.getItems().filter((i) => i.status === 'pending').length === 0) {
      this.props.showSnack('No pending images to process', { timeout: 2000 });
      return;
    }

    try {
      await store.processConcurrently();
      const stats = store.getStats();
      this.props.showSnack(
        `Processing complete: ${stats.completed} succeeded, ${stats.failed} failed`,
        { timeout: 3000 }
      );
    } catch (error) {
      this.props.showSnack(`Processing error: ${(error as Error).message}`, {
        timeout: 5000,
      });
    }
  };

  private handleStopProcessing = (): void => {
    this.state.store.stopProcessing();
    this.props.showSnack('Processing stopped', { timeout: 2000 });
  };

  private handleRetryItem = async (id: string): Promise<void> => {
    try {
      await this.state.store.retryItem(id);
      this.props.showSnack('Retrying...', { timeout: 1500 });
      await this.state.store.processConcurrently();
    } catch (error) {
      this.props.showSnack(`Retry failed: ${(error as Error).message}`, {
        timeout: 3000,
      });
    }
  };

  private handleRemoveItem = (id: string): void => {
    this.state.store.removeItem(id);
  };

  private handleDownloadItem = (id: string): void => {
    const item = this.state.store.getItem(id);
    if (!item || !item.downloadUrl || !item.compressedFile) {
      return;
    }

    const link = document.createElement('a');
    link.href = item.downloadUrl;
    link.download = item.compressedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  private handleDownloadAll = async (): Promise<void> => {
    const { store } = this.state;
    const items = store.getItems();

    if (!hasCompressedItems(items)) {
      this.props.showSnack('No compressed images to download', { timeout: 2000 });
      return;
    }

    try {
      this.props.showSnack('Preparing download...', { timeout: 5000 });

      await createStreamingZipDownload(
        store,
        `compressed-${Date.now()}.zip`,
        ({ current, total, filename }) => {
          console.log(`Download progress: ${current}/${total} - ${filename}`);
        }
      );

      const completed = getCompletedItems(items).length;
      this.props.showSnack(`Downloaded ${completed} image(s)`, { timeout: 2000 });
    } catch (error) {
      this.props.showSnack(`Download failed: ${(error as Error).message}`, {
        timeout: 5000,
      });
    }
  };

  private handleClearAll = (): void => {
    this.state.store.clearAll();
    this.props.showSnack('All images cleared', { timeout: 2000 });
  };

  private handleClearCompleted = (): void => {
    this.state.store.clearCompleted();
    this.props.showSnack('Completed images cleared', { timeout: 2000 });
  };

  render(
    { onBack, onSwitchToSingle, showSnack }: Props,
    { items, stats, isProcessing, overallProgress, globalSettings }: State,
  ) {
    const hasItems = items.length > 0;
    const hasPending = stats.pending > 0;
    const hasCompleted = stats.completed > 0;

    const encoderOptions = getEncoderOptions();

    return (
      <div class={style.batchCompress}>
        <div class={style.header}>
          <div class={style.headerLeft}>
            <button class={style.backButton} onClick={onBack}>
              <BackIcon />
            </button>
            <h1 class={style.title}>Batch Compression</h1>
            <div class={style.stats}>
              <span class={style.statItem}>
                {stats.total} image{stats.total !== 1 ? 's' : ''}
              </span>
              {isProcessing && (
                <span class={style.statItem}>
                  <loading-spinner />
                  Processing...
                </span>
              )}
              {!isProcessing && stats.completed > 0 && (
                <span class={style.statItem}>{stats.completed} done</span>
              )}
              {stats.failed > 0 && (
                <span class={style.statItem} style={{ color: 'rgba(255, 80, 80, 0.9)' }}>
                  {stats.failed} failed
                </span>
              )}
            </div>
          </div>

          <div class={style.headerActions}>
            {hasCompleted && (
              <button
                class={style.primaryButton}
                onClick={this.handleDownloadAll}
                disabled={isProcessing}
              >
                <DownloadIcon />
                Download All
              </button>
            )}
            {isProcessing ? (
              <button
                class={style.secondaryButton}
                onClick={this.handleStopProcessing}
              >
                <StopIcon />
                Stop
              </button>
            ) : (
              <button
                class={style.primaryButton}
                onClick={this.handleStartProcessing}
                disabled={!hasPending}
              >
                <PlayIcon />
                Start
              </button>
            )}
            {hasItems && (
              <button
                class={style.secondaryButton}
                onClick={this.handleClearCompleted}
                disabled={isProcessing}
              >
                <TrashIcon />
                Clear Done
              </button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div class={style.progressSection}>
            <div class={style.progressContainer}>
              <div class={style.progressBar}>
                <div
                  class={style.progressFill}
                  style={{ width: `${overallProgress * 100}%` }}
                />
              </div>
              <span class={style.progressText}>
                {Math.round(overallProgress * 100)}%
              </span>
            </div>
          </div>
        )}

        <div class={style.settingsPanel}>
          <div class={style.settingsHeader}>
            <span class={style.settingsTitle}>
              <SettingsIcon /> Global Settings
            </span>
            <button
              class={style.secondaryButton}
              onClick={this.handleApplySettings}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              Apply to All
            </button>
          </div>
          <div class={style.settingsContent}>
            <div class={style.settingItem}>
              <label class={style.settingLabel}>Format:</label>
              <select
                class={style.settingSelect}
                value={globalSettings.encoderState?.type || 'mozJPEG'}
                onChange={this.handleEncoderChange}
                disabled={isProcessing}
              >
                {encoderOptions.map((opt) => (
                  <option value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div class={style.content}>
          {!hasItems ? (
            <file-drop
              class={style.dropZone}
              onfiledrop={this.onFileDrop}
            >
              <div class={style.dropIcon}>
                <UploadIcon />
              </div>
              <p class={style.dropText}>
                Drag & drop images here, or click to browse
              </p>
              <p class={style.dropHint}>
                Supports JPEG, PNG, WebP, AVIF, and more
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={this.onFileInputChange}
                ref={(el) => (this.fileInput = el)}
              />
            </file-drop>
          ) : (
            <div class={style.fileList}>
              {items.map((item) => (
                <BatchItemCard
                  key={item.id}
                  item={item}
                  onRetry={this.handleRetryItem}
                  onRemove={this.handleRemoveItem}
                  onDownload={this.handleDownloadItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
