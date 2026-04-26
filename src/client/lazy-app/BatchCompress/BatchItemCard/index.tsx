import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { BatchItem, BatchItemStatus } from '../../batch/types';
import prettyBytes from '../../Compress/Results/pretty-bytes';
import {
  CheckIcon,
  CrossIcon,
  RetryIcon,
  DownloadIcon,
  TrashIcon,
  ImageIcon,
  SpinnerIcon,
} from 'client/lazy-app/icons';

interface Props {
  item: BatchItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
}

function getStatusClass(status: BatchItemStatus): keyof typeof style {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'decoding':
    case 'preprocessing':
    case 'processing':
    case 'encoding':
      return 'active';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

function getStatusText(status: BatchItemStatus): string {
  switch (status) {
    case 'pending':
      return 'Waiting';
    case 'decoding':
      return 'Decoding';
    case 'preprocessing':
      return 'Preprocessing';
    case 'processing':
      return 'Processing';
    case 'encoding':
      return 'Encoding';
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Failed';
    default:
      return 'Waiting';
  }
}

function getCardStatusClass(status: BatchItemStatus): keyof typeof style {
  switch (status) {
    case 'pending':
      return 'statusPending';
    case 'decoding':
    case 'preprocessing':
    case 'processing':
    case 'encoding':
      return 'statusActive';
    case 'completed':
      return 'statusCompleted';
    case 'failed':
      return 'statusFailed';
    default:
      return 'statusPending';
  }
}

function formatPercentage(before: number, after: number): string {
  if (before === 0) return '0%';
  const ratio = after / before;
  const absolutePercent = Math.round(Math.abs(ratio) * 100);
  const percent = ratio > 1 ? absolutePercent - 100 : 100 - absolutePercent;
  return `${ratio < 1 ? '↓' : '↑'}${percent}%`;
}

export default class BatchItemCard extends Component<Props> {
  private objectUrl: string | undefined;

  componentWillUnmount(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private getThumbnailUrl(): string | undefined {
    const { item } = this.props;

    if (item.compressedFile) {
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
      }
      this.objectUrl = URL.createObjectURL(item.compressedFile);
      return this.objectUrl;
    }

    return undefined;
  }

  private handleRetry = (): void => {
    this.props.onRetry(this.props.item.id);
  };

  private handleRemove = (): void => {
    this.props.onRemove(this.props.item.id);
  };

  private handleDownload = (): void => {
    this.props.onDownload(this.props.item.id);
  };

  render(
    { item, onRetry, onRemove, onDownload }: Props,
  ) {
    const statusClass = getStatusClass(item.status);
    const cardStatusClass = getCardStatusClass(item.status);
    const isActive = item.status !== 'pending' && item.status !== 'completed' && item.status !== 'failed';
    const showProgress = isActive;

    const thumbnailUrl = this.getThumbnailUrl();
    const originalSize = item.file ? prettyBytes(item.file.size) : null;
    const compressedSize = item.compressedFile ? prettyBytes(item.compressedFile.size) : null;

    return (
      <div class={`${style.batchItemCard} ${style[cardStatusClass]}`}>
        <div class={style.thumbnailContainer}>
          {thumbnailUrl ? (
            <img class={style.thumbnail} src={thumbnailUrl} alt={item.file.name} loading="lazy" />
          ) : (
            <div class={style.thumbnailPlaceholder}>
              <ImageIcon />
            </div>
          )}

          <div class={`${style.statusOverlay} ${style[statusClass]}`}>
            {isActive ? (
              <SpinnerIcon class={`${style.statusIcon} ${style.spinner}`} />
            ) : item.status === 'completed' ? (
              <CheckIcon class={style.statusIcon} />
            ) : item.status === 'failed' ? (
              <CrossIcon class={style.statusIcon} />
            ) : null}
            <span>{getStatusText(item.status)}</span>
          </div>
        </div>

        <div class={style.infoSection}>
          <p class={style.filename} title={item.file.name}>
            {item.file.name}
          </p>

          <div class={style.sizeInfo}>
            {originalSize && (
              <span>
                {originalSize.value} <span>{originalSize.unit}</span>
              </span>
            )}
            {compressedSize && (
              <span>
                <span>→</span>
                <span>
                  {compressedSize.value} <span>{compressedSize.unit}</span>
                </span>
                <span class={style.sizeSavings}>
                  {formatPercentage(item.file.size, item.compressedFile!.size)}
                </span>
              </span>
            )}
          </div>

          {showProgress && (
            <div class={style.progressRow}>
              <div class={style.progressText}>
                <span>{getStatusText(item.status)}</span>
                <span>{Math.round(item.progress * 100)}%</span>
              </div>
              <div class={style.miniProgress}>
                <div
                  class={style.miniProgressFill}
                  style={{ width: `${item.progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {item.retryCount > 0 && (
            <div class={style.retryCount}>
              Retry {item.retryCount}/{item.maxRetries}
            </div>
          )}

          {item.error && (
            <div class={style.errorMessage} title={item.error.message}>
              {item.error.message}
            </div>
          )}

          <div class={style.actionsRow}>
            {item.status === 'failed' && item.retryCount < item.maxRetries && (
              <button class={style.retryBtn} onClick={this.handleRetry}>
                <RetryIcon />
                Retry
              </button>
            )}
            {item.status === 'completed' && item.downloadUrl && (
              <button class={style.downloadBtn} onClick={this.handleDownload}>
                <DownloadIcon />
                Download
              </button>
            )}
            <button class={style.removeBtn} onClick={this.handleRemove}>
              <TrashIcon />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }
}
