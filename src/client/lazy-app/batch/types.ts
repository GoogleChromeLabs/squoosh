import { PreprocessorState, ProcessorState, EncoderState } from '../feature-meta';

export type BatchItemStatus =
  | 'pending'
  | 'decoding'
  | 'preprocessing'
  | 'processing'
  | 'encoding'
  | 'completed'
  | 'failed';

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  progress: number;
  error?: Error;
  retryCount: number;
  maxRetries: number;

  decoded?: ImageData;
  preprocessed?: ImageData;
  processed?: ImageData;
  compressedFile?: File;
  downloadUrl?: string;

  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

export interface BatchStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
}

export interface WorkerPoolConfig {
  maxConcurrency: number;
  workerIdleTimeout: number;
}

export interface Task {
  id: string;
  type: string;
  signal: AbortSignal;
  args: any[];
  priority: number;
}

export interface TaskResult<T = any> {
  taskId: string;
  success: boolean;
  data?: T;
  error?: Error;
}

export type TaskCallback<T = any> = (result: TaskResult<T>) => void;
