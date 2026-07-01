import { h, Component, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import {
  blobToImg,
  blobToText,
  builtinDecode,
  sniffMimeType,
  canDecodeImageType,
  abortable,
  assertSignal,
  ImageMimeTypes,
} from '../util';
import {
  EncoderState,
  encoderMap,
  defaultProcessorState,
  defaultPreprocessorState,
  EncoderType,
} from '../feature-meta';
import WorkerBridge from '../worker-bridge';
import { resize } from 'features/processors/resize/client';
import { drawableToImageData } from '../util/canvas';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import Compress from '../Compress';

export type BatchItemStatus = 'pending' | 'processing' | 'done' | 'error';

export interface BatchItem {
  id: string;
  file: File;
  thumbnailUrl?: string;
  compressedFile?: File;
  compressedUrl?: string;
  status: BatchItemStatus;
  errorMsg?: string;
  selected: boolean;
  customEncoderState?: EncoderState;
}

interface Props {
  initialFiles: File[];
  showSnack: SnackBarElement['showSnackbar'];
  onBack: () => void;
}

interface State {
  items: BatchItem[];
  defaultFormat: EncoderType;
  defaultQuality: number; // 0-100
  editingItemId?: string;
}

/** Max concurrent compressions */
const MAX_CONCURRENT = 3;
/** Max images in a batch */
const MAX_BATCH_SIZE = 20;

/** Map 0-100 quality to encoder-native quality */
function qualityToEncoderState(
  format: EncoderType,
  quality: number,
): EncoderState {
  const meta = encoderMap[format].meta;
  const defaults = { ...meta.defaultOptions } as any;

  switch (format) {
    case 'mozJPEG':
      return { type: format, options: { ...defaults, quality } };
    case 'webP':
      return { type: format, options: { ...defaults, quality } };
    case 'avif':
      // avif cqLevel: 0=best, 63=worst — invert quality
      return {
        type: format,
        options: { ...defaults, cqLevel: Math.round(63 - (quality / 100) * 63) },
      };
    case 'jxl':
      return { type: format, options: { ...defaults, quality } };
    case 'oxiPNG':
      // oxipng uses level 0-6 (effort), not quality per se
      return {
        type: format,
        options: { ...defaults, level: Math.round((quality / 100) * 6) },
      };
    case 'wp2':
      return { type: format, options: { ...defaults, quality } };
    default:
      return { type: format, options: defaults };
  }
}

function prettyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function generateThumbnail(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  return url; // Revoke later when item removed
}

async function processSvg(
  signal: AbortSignal,
  blob: Blob,
): Promise<HTMLImageElement> {
  assertSignal(signal);
  const parser = new DOMParser();
  const text = await abortable(signal, blobToText(blob));
  const document = parser.parseFromString(text, 'image/svg+xml');
  const svg = document.documentElement!;

  if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
    return blobToImg(blob);
  }

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox === null) throw Error('SVG must have width/height or viewBox');

  const viewboxParts = viewBox.split(/\s+/);
  svg.setAttribute('width', viewboxParts[2]);
  svg.setAttribute('height', viewboxParts[3]);

  const serializer = new XMLSerializer();
  const newSource = serializer.serializeToString(document);
  return abortable(
    signal,
    blobToImg(new Blob([newSource], { type: 'image/svg+xml' })),
  );
}

async function decodeImage(
  signal: AbortSignal,
  blob: Blob,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));
  const canDecode = await abortable(signal, canDecodeImageType(mimeType));

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        return await workerBridge.avifDecode(signal, blob);
      }
      if (mimeType === 'image/webp') {
        return await workerBridge.webpDecode(signal, blob);
      }
      if (mimeType === 'image/jxl') {
        return await workerBridge.jxlDecode(signal, blob);
      }
      if (mimeType === 'image/webp2') {
        return await workerBridge.wp2Decode(signal, blob);
      }
      if (mimeType === 'image/qoi') {
        return await workerBridge.qoiDecode(signal, blob);
      }
    }
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw Error("Couldn't decode image");
  }
}

async function compressImage(
  signal: AbortSignal,
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
  workerBridge: WorkerBridge,
): Promise<File> {
  assertSignal(signal);
  const encoder = encoderMap[encodeData.type];
  const compressedData = await encoder.encode(
    signal,
    workerBridge,
    image,
    encodeData.options as any,
  );

  const type: ImageMimeTypes = encoder.meta.mimeType;
  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type },
  );
}

export default class Batch extends Component<Props, State> {
  state: State = {
    items: [],
    defaultFormat: 'mozJPEG',
    defaultQuality: 75,
    editingItemId: undefined,
  };

  private workerPool: WorkerBridge[] = Array.from(
    { length: MAX_CONCURRENT },
    () => new WorkerBridge(),
  );
  private abortControllers = new Map<string, AbortController>();
  private fileInputRef?: HTMLInputElement;

  componentDidMount() {
    this.addFiles(this.props.initialFiles);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.initialFiles !== this.props.initialFiles) {
      const currentFiles = new Set(this.state.items.map((i) => i.file));
      const newFiles = nextProps.initialFiles.filter((f) => !currentFiles.has(f));
      if (newFiles.length > 0) {
        this.addFiles(newFiles);
      }
    }
  }

  componentWillUnmount() {
    // Abort all running jobs
    for (const ac of this.abortControllers.values()) ac.abort();
    // Revoke thumbnail URLs
    for (const item of this.state.items) {
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    }
  }

  private addFiles = async (files: File[]) => {
    const { items } = this.state;
    const remaining = MAX_BATCH_SIZE - items.length;
    if (remaining <= 0) {
      this.props.showSnack(`Batch limit reached (${MAX_BATCH_SIZE} images max)`);
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      this.props.showSnack(`Only added ${remaining} image(s) — batch limit is ${MAX_BATCH_SIZE}`);
    }

    const newItems: BatchItem[] = await Promise.all(
      toAdd.map(async (file) => {
        const thumbnailUrl = await generateThumbnail(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          thumbnailUrl,
          status: 'pending' as BatchItemStatus,
          selected: true,
        };
      }),
    );

    this.setState(
      (s) => ({ items: [...s.items, ...newItems] }),
      () => this.runQueue(),
    );
  };

  private runQueue = async () => {
    const { items, defaultFormat, defaultQuality } = this.state;
    const pendingItems = items.filter((i) => i.status === 'pending');
    const processingCount = items.filter(
      (i) => i.status === 'processing',
    ).length;
    const slotsAvailable = MAX_CONCURRENT - processingCount;

    const toProcess = pendingItems.slice(0, slotsAvailable);

    for (const item of toProcess) {
      const workerIdx =
        items.filter((i) => i.status === 'processing').length % MAX_CONCURRENT;
      this.processItem(
        item,
        this.workerPool[workerIdx],
        item.customEncoderState ||
          qualityToEncoderState(defaultFormat, defaultQuality),
      );
    }
  };

  private processItem = async (
    item: BatchItem,
    workerBridge: WorkerBridge,
    encoderState: EncoderState,
  ) => {
    const ac = new AbortController();
    this.abortControllers.set(item.id, ac);
    const signal = ac.signal;

    // Mark as processing
    this.setState((s) => ({
      items: s.items.map((i) =>
        i.id === item.id ? { ...i, status: 'processing' } : i,
      ),
    }));

    try {
      let decoded: ImageData;

      if (item.file.type.startsWith('image/svg+xml')) {
        const vectorImage = await processSvg(signal, item.file);
        decoded = drawableToImageData(vectorImage);
      } else {
        decoded = await decodeImage(signal, item.file, workerBridge);
      }

      // Basic preprocessing (rotation default = 0, no-op)
      // Skip resize - preserve original dimensions in batch mode
      assertSignal(signal);

      const compressed = await compressImage(
        signal,
        decoded,
        encoderState,
        item.file.name,
        workerBridge,
      );

      const compressedUrl = URL.createObjectURL(compressed);

      // Revoke old compressed URL if any
      const old = this.state.items.find((i) => i.id === item.id);
      if (old?.compressedUrl) URL.revokeObjectURL(old.compressedUrl);

      this.setState(
        (s) => ({
          items: s.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  compressedFile: compressed,
                  compressedUrl,
                }
              : i,
          ),
        }),
        () => this.runQueue(),
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      this.setState(
        (s) => ({
          items: s.items.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', errorMsg: String(err) }
              : i,
          ),
        }),
        () => this.runQueue(),
      );
    } finally {
      this.abortControllers.delete(item.id);
    }
  };

  private removeItem = (id: string) => {
    const ac = this.abortControllers.get(id);
    if (ac) ac.abort();

    this.setState((s) => {
      const item = s.items.find((i) => i.id === id);
      if (item) {
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      }
      return { items: s.items.filter((i) => i.id !== id) };
    });
  };

  private toggleSelect = (id: string) => {
    this.setState((s) => ({
      items: s.items.map((i) =>
        i.id === id ? { ...i, selected: !i.selected } : i,
      ),
    }));
  };

  private onFormatChange = (e: Event) => {
    const format = (e.currentTarget as HTMLSelectElement).value as EncoderType;
    this.setState({ defaultFormat: format });
  };

  private onQualityChange = (e: Event) => {
    const quality = Number((e.currentTarget as HTMLInputElement).value);
    this.setState({ defaultQuality: quality });
  };

  private applyToAll = () => {
    const { defaultFormat, defaultQuality } = this.state;
    // Re-queue all non-processing items with new settings
    this.setState(
      (s) => ({
        items: s.items.map((i) => {
          if (i.status === 'processing') return i;
          // Revoke old compressed URL
          if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
          return {
            ...i,
            status: 'pending',
            compressedFile: undefined,
            compressedUrl: undefined,
            customEncoderState: undefined,
            errorMsg: undefined,
          };
        }),
      }),
      () => this.runQueue(),
    );
  };

  private reprocessItem = (id: string) => {
    const { defaultFormat, defaultQuality } = this.state;
    this.setState(
      (s) => ({
        items: s.items.map((i) => {
          if (i.id !== id) return i;
          if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
          return {
            ...i,
            status: 'pending',
            compressedFile: undefined,
            compressedUrl: undefined,
            errorMsg: undefined,
          };
        }),
      }),
      () => this.runQueue(),
    );
  };

  private onEditItem = (id: string) => {
    this.setState({ editingItemId: id });
  };

  private onCloseEditor = () => {
    this.setState({ editingItemId: undefined });
  };

  private onFileDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  };

  private onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  private onFileInputChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  };

  private onAddMoreClick = () => {
    this.fileInputRef?.click();
  };

  private downloadAll = async () => {
    const { items } = this.state;
    const selected = items.filter((i) => i.selected && i.compressedFile);

    if (selected.length === 0) {
      this.props.showSnack('No compressed images to download');
      return;
    }

    if (selected.length === 1) {
      // Single file: direct download
      const item = selected[0];
      const a = document.createElement('a');
      a.href = item.compressedUrl!;
      a.download = item.compressedFile!.name;
      a.click();
      return;
    }

    // Multiple: ZIP via fflate
    try {
      const { zip } = await import('fflate');

      const fileMap: Record<string, Uint8Array> = {};
      await Promise.all(
        selected.map(async (item) => {
          const buf = await item.compressedFile!.arrayBuffer();
          fileMap[item.compressedFile!.name] = new Uint8Array(buf);
        }),
      );

      zip(fileMap, (err, data) => {
        if (err) {
          this.props.showSnack('Failed to create ZIP');
          return;
        }
        const blob = new Blob([data], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'squoosh-batch.zip';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    } catch (err) {
      this.props.showSnack('Failed to create ZIP');
    }
  };

  render(
    { onBack }: Props,
    { items, defaultFormat, defaultQuality, editingItemId }: State,
  ) {
    const doneItems = items.filter((i) => i.status === 'done');
    const selectedDone = doneItems.filter((i) => i.selected);
    const totalOriginal = doneItems.reduce((s, i) => s + i.file.size, 0);
    const totalCompressed = doneItems.reduce(
      (s, i) => s + (i.compressedFile?.size || 0),
      0,
    );
    const totalSavingPct =
      totalOriginal > 0
        ? Math.round((1 - totalCompressed / totalOriginal) * 100)
        : 0;

    const editingItem = editingItemId
      ? items.find((i) => i.id === editingItemId)
      : undefined;

    // Formats available
    const formats: { value: EncoderType; label: string }[] = [
      { value: 'mozJPEG', label: 'MozJPEG' },
      { value: 'webP', label: 'WebP' },
      { value: 'avif', label: 'AVIF' },
      { value: 'jxl', label: 'JXL' },
      { value: 'oxiPNG', label: 'OxiPNG' },
      { value: 'wp2', label: 'WebP2' },
    ];

    const qualityPct = `${defaultQuality}%`;

    return (
      <div class={style.batchPage}>
        {/* Top Bar */}
        <div class={style.topBar}>
          <button class={style.backBtn} onClick={onBack} title="Back to home">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <span class={style.topBarTitle}>Batch Compress</span>
          {items.length > 0 && (
            <span class={style.topBarCount}>
              {items.length} / {MAX_BATCH_SIZE}
            </span>
          )}
        </div>

        {/* Settings Panel */}
        <div class={style.settingsPanel}>
          <span class={style.settingsLabel}>Default:</span>
          <div class={style.settingsGroup}>
            <select
              class={style.formatSelect}
              value={defaultFormat}
              onChange={this.onFormatChange}
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <div class={style.qualityGroup}>
              <input
                type="range"
                class={style.qualitySlider}
                min="0"
                max="100"
                value={defaultQuality}
                style={{ '--quality-pct': qualityPct }}
                onInput={this.onQualityChange}
              />
              <span class={style.qualityValue}>{defaultQuality}%</span>
            </div>

            <button class={style.applyAllBtn} onClick={this.applyToAll} disabled={items.length === 0}>
              Apply to all
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div class={style.actionsBar}>
          <button
            id="batch-download-all-btn"
            class={style.btnPrimary}
            onClick={this.downloadAll}
            disabled={selectedDone.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Download {selectedDone.length > 1 ? 'ZIP' : ''} ({selectedDone.length})
          </button>

          <button
            class={style.btnSecondary}
            onClick={this.applyToAll}
            disabled={items.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Recompress All
          </button>

          <div class={style.actionsSpacer} />

          <input
            ref={(el) => (this.fileInputRef = el as HTMLInputElement)}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={this.onFileInputChange}
          />
          <button
            class={style.addMoreBtn}
            onClick={this.onAddMoreClick}
            disabled={items.length >= MAX_BATCH_SIZE}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add More
          </button>
        </div>

        {/* Content Area */}
        {items.length === 0 ? (
          /* Empty / Drop Zone */
          <div
            class={style.dropZone}
            onDrop={this.onFileDrop}
            onDragOver={this.onDragOver}
          >
            <div class={style.dropZoneIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
            </div>
            <p class={style.dropZoneText}>Drop images here</p>
            <p class={style.dropZoneSub}>
              Up to {MAX_BATCH_SIZE} images · JPG, PNG, WebP, AVIF, JXL, SVG
            </p>
            <input
              class={style.dropZoneInput}
              type="file"
              accept="image/*"
              multiple
              onChange={this.onFileInputChange}
            />
          </div>
        ) : (
          /* Image Grid */
          <div class={style.imageGrid}>
            {items.map((item) => (
              <BatchCard
                key={item.id}
                item={item}
                onRemove={this.removeItem}
                onToggleSelect={this.toggleSelect}
                onEdit={this.onEditItem}
                onRetry={this.reprocessItem}
              />
            ))}
          </div>
        )}

        {/* Summary bar */}
        {doneItems.length > 0 && (
          <div class={style.summaryBar}>
            <span class={style.summaryItem}>
              <strong>{doneItems.length}</strong> compressed
            </span>
            <span class={style.summaryItem}>
              Original: <strong>{prettyBytes(totalOriginal)}</strong>
            </span>
            <span class={style.summaryItem}>
              Compressed: <strong>{prettyBytes(totalCompressed)}</strong>
            </span>
            {totalSavingPct > 0 && (
              <span class={`${style.summaryItem} ${style.summarySavings}`}>
                Saved {totalSavingPct}%!
              </span>
            )}
          </div>
        )}

        {/* Individual Image Editor Modal */}
        {editingItem && (
          <BatchItemEditor
            item={editingItem}
            onClose={this.onCloseEditor}
            onSaveSettings={(id, encoderState) => {
              this.setState(
                (s) => ({
                  items: s.items.map((i) =>
                    i.id === id
                      ? {
                          ...i,
                          customEncoderState: encoderState,
                          status: 'pending',
                          compressedFile: undefined,
                          compressedUrl: undefined,
                        }
                      : i,
                  ),
                }),
                () => {
                  this.onCloseEditor();
                  this.runQueue();
                },
              );
            }}
          />
        )}
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BatchCard
// ─────────────────────────────────────────────────────────────────────────────

interface BatchCardProps {
  item: BatchItem;
  onRemove: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRetry: (id: string) => void;
}

function BatchCard({ item, onRemove, onToggleSelect, onEdit, onRetry }: BatchCardProps) {
  const sizeBefore = prettyBytes(item.file.size);
  const sizeAfter = item.compressedFile
    ? prettyBytes(item.compressedFile.size)
    : null;
  const savings =
    item.compressedFile
      ? Math.round((1 - item.compressedFile.size / item.file.size) * 100)
      : null;

  const cardClass = [
    style.card,
    item.selected ? style.isSelected : '',
    item.status === 'error' ? style.isError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={cardClass}>
      <input
        type="checkbox"
        class={style.cardCheckbox}
        checked={item.selected}
        onChange={() => onToggleSelect(item.id)}
        title="Select for download"
      />
      <button
        class={style.cardRemove}
        onClick={() => onRemove(item.id)}
        title="Remove"
      >
        ✕
      </button>

      {/* Thumbnail */}
      {item.thumbnailUrl ? (
        <img
          class={style.cardThumb}
          src={item.compressedUrl || item.thumbnailUrl}
          alt={item.file.name}
          loading="lazy"
        />
      ) : (
        <div class={style.cardThumbPlaceholder}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      )}

      <div class={style.cardBody}>
        {/* Progress bar */}
        <div class={style.cardProgress}>
          <div
            class={style.cardProgressFill}
            style={{
              width:
                item.status === 'done' || item.status === 'error'
                  ? '100%'
                  : item.status === 'processing'
                  ? '60%'
                  : '0%',
            }}
          />
        </div>

        {/* File name */}
        <div class={style.cardName} title={item.file.name}>
          {item.file.name}
        </div>

        {/* Sizes */}
        <div class={style.cardSizes}>
          <span>{sizeBefore}</span>
          {sizeAfter && (
            <Fragment>
              <span class={style.cardSizeArrow}>→</span>
              <span class={style.cardSizeAfter}>{sizeAfter}</span>
              {savings !== null && (
                <span
                  class={`${style.cardSaving} ${savings >= 0 ? style.saved : style.grew}`}
                >
                  {savings >= 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
                </span>
              )}
            </Fragment>
          )}
        </div>

        {/* Status */}
        <div
          class={`${style.cardStatus} ${style[item.status as keyof typeof style]}`}
        >
          <span class={style.statusDot} />
          {item.status === 'error' ? item.errorMsg || 'Error' : item.status}
        </div>
      </div>

      {/* Footer */}
      <div class={style.cardFooter}>
        <button
          class={style.cardBtn}
          onClick={() => onEdit(item.id)}
          title="Fine-tune this image"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          Edit
        </button>

        {item.status === 'error' && (
          <button
            class={style.cardBtn}
            onClick={() => onRetry(item.id)}
            title="Retry"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Retry
          </button>
        )}

        {item.compressedUrl && (
          <a
            class={style.cardBtnDl}
            href={item.compressedUrl}
            download={item.compressedFile?.name}
            title="Download this image"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Save
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BatchItemEditor — modal wrapping the full Compress editor
// ─────────────────────────────────────────────────────────────────────────────

interface BatchItemEditorProps {
  item: BatchItem;
  onClose: () => void;
  onSaveSettings: (id: string, encoderState: EncoderState) => void;
}

interface BatchItemEditorState {
  CompressComponent?: typeof import('client/lazy-app/Compress').default;
}

class BatchItemEditor extends Component<BatchItemEditorProps, BatchItemEditorState> {
  state: BatchItemEditorState = {};

  componentDidMount() {
    import('client/lazy-app/Compress').then((m) => {
      this.setState({ CompressComponent: m.default });
    });
  }

  private onBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this.props.onClose();
  };

  private noop = () => {};

  render({ item, onClose }: BatchItemEditorProps, { CompressComponent }: BatchItemEditorState) {
    return (
      <div class={style.modalBackdrop} onClick={this.onBackdropClick}>
        <div class={style.modal}>
          <div class={style.modalHeader}>
            <span class={style.modalTitle}>
              Fine-tune: {item.file.name}
            </span>
            <button class={style.modalClose} onClick={onClose} title="Close">✕</button>
          </div>
          <div class={style.modalBody}>
            {CompressComponent ? (
              <CompressComponent
                file={item.file}
                showSnack={async (msg: string) => {
                  console.log(msg);
                  return 'dismiss';
                }}
                onBack={onClose}
              />
            ) : (
              <div class={style.emptyState}>Loading editor…</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
