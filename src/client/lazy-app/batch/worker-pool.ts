import { wrap } from 'comlink';
import workerURL from 'omt:../../../features-worker';
import type { ProcessorWorkerApi } from '../../../features-worker';
import { abortable } from '../util';
import { Task, TaskResult, WorkerPoolConfig, TaskCallback } from './types';

export const DEFAULT_WORKER_POOL_CONFIG: WorkerPoolConfig = {
  maxConcurrency: Math.max(1, (navigator.hardwareConcurrency || 4) - 1),
  workerIdleTimeout: 30_000,
};

interface WorkerInstance {
  id: string;
  worker: Worker;
  api: ProcessorWorkerApi;
  currentTaskId?: string;
  lastUsedAt: number;
  idleTimeout?: number;
  codecUsageCount: Map<string, number>;
}

interface QueuedTask {
  task: Task;
  callback: TaskCallback;
  enqueuedAt: number;
}

export class WorkerPool {
  private config: WorkerPoolConfig;
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: QueuedTask[] = [];
  private isProcessingQueue = false;
  private workerIdCounter = 0;

  constructor(config: Partial<WorkerPoolConfig> = {}) {
    this.config = { ...DEFAULT_WORKER_POOL_CONFIG, ...config };
  }

  get activeWorkerCount(): number {
    let count = 0;
    for (const worker of this.workers.values()) {
      if (worker.currentTaskId) count++;
    }
    return count;
  }

  get totalWorkerCount(): number {
    return this.workers.size;
  }

  get queuedTaskCount(): number {
    return this.taskQueue.length;
  }

  private createWorkerInstance(): WorkerInstance {
    const worker = new Worker(workerURL);
    const api = wrap<ProcessorWorkerApi>(worker);
    const id = `worker-${++this.workerIdCounter}`;

    const instance: WorkerInstance = {
      id,
      worker,
      api,
      lastUsedAt: Date.now(),
      codecUsageCount: new Map(),
    };

    this.workers.set(id, instance);
    return instance;
  }

  private terminateWorker(id: string): void {
    const instance = this.workers.get(id);
    if (!instance) return;

    if (instance.idleTimeout) {
      clearTimeout(instance.idleTimeout);
    }
    instance.worker.terminate();
    this.workers.delete(id);
  }

  private scheduleIdleTermination(workerId: string): void {
    const instance = this.workers.get(workerId);
    if (!instance) return;

    if (instance.idleTimeout) {
      clearTimeout(instance.idleTimeout);
    }

    instance.idleTimeout = self.setTimeout(() => {
      if (!instance.currentTaskId) {
        this.terminateWorker(workerId);
      }
    }, this.config.workerIdleTimeout);
  }

  private findIdleWorker(): WorkerInstance | undefined {
    for (const worker of this.workers.values()) {
      if (!worker.currentTaskId) {
        return worker;
      }
    }
    return undefined;
  }

  private findWorkerWithCodecExperience(codecType: string): WorkerInstance | undefined {
    let bestWorker: WorkerInstance | undefined;
    let maxCount = 0;

    for (const worker of this.workers.values()) {
      if (!worker.currentTaskId) {
        const count = worker.codecUsageCount.get(codecType) || 0;
        if (count > maxCount) {
          maxCount = count;
          bestWorker = worker;
        }
      }
    }

    return bestWorker;
  }

  private acquireWorker(codecType?: string): WorkerInstance | undefined {
    const activeCount = this.activeWorkerCount;

    if (activeCount >= this.config.maxConcurrency) {
      return undefined;
    }

    if (codecType) {
      const experienced = this.findWorkerWithCodecExperience(codecType);
      if (experienced) {
        return experienced;
      }
    }

    const idle = this.findIdleWorker();
    if (idle) {
      return idle;
    }

    if (this.workers.size < this.config.maxConcurrency) {
      return this.createWorkerInstance();
    }

    return undefined;
  }

  private async executeTaskOnWorker(
    worker: WorkerInstance,
    task: Task,
    callback: TaskCallback
  ): Promise<void> {
    worker.currentTaskId = task.id;
    worker.lastUsedAt = Date.now();

    if (worker.idleTimeout) {
      clearTimeout(worker.idleTimeout);
      worker.idleTimeout = undefined;
    }

    const codecType = this.extractCodecType(task.type);
    if (codecType) {
      const currentCount = worker.codecUsageCount.get(codecType) || 0;
      worker.codecUsageCount.set(codecType, currentCount + 1);
    }

    try {
      const methodName = task.type as keyof ProcessorWorkerApi;

      const result = await abortable(
        task.signal,
        (worker.api as any)[methodName](...task.args)
      );

      callback({
        taskId: task.id,
        success: true,
        data: result,
      });
    } catch (error) {
      callback({
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      worker.currentTaskId = undefined;
      worker.lastUsedAt = Date.now();
      this.scheduleIdleTermination(worker.id);
      this.processQueue();
    }
  }

  private extractCodecType(taskType: string): string | undefined {
    const match = taskType.match(/^(avif|jxl|mozjpeg|oxipng|qoi|webp|wp2)(Encode|Decode)$/i);
    if (match) {
      return match[1].toLowerCase();
    }
    return undefined;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    if (this.taskQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue[0];
        const codecType = this.extractCodecType(nextTask.task.type);
        const worker = this.acquireWorker(codecType);

        if (!worker) {
          break;
        }

        this.taskQueue.shift();
        this.executeTaskOnWorker(worker, nextTask.task, nextTask.callback);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  submit<T = any>(
    taskType: string,
    signal: AbortSignal,
    args: any[],
    priority: number = 0
  ): Promise<TaskResult<T>> {
    return new Promise((resolve) => {
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: taskType,
        signal,
        args,
        priority,
      };

      const queuedTask: QueuedTask = {
        task,
        callback: resolve as TaskCallback,
        enqueuedAt: Date.now(),
      };

      const insertIndex = this.taskQueue.findIndex(
        (t) => t.task.priority < priority
      );

      if (insertIndex === -1) {
        this.taskQueue.push(queuedTask);
      } else {
        this.taskQueue.splice(insertIndex, 0, queuedTask);
      }

      this.processQueue();
    });
  }

  cancelTask(taskId: string): boolean {
    const index = this.taskQueue.findIndex((t) => t.task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  clearQueue(): void {
    this.taskQueue = [];
  }

  terminateAll(): void {
    this.clearQueue();
    for (const workerId of this.workers.keys()) {
      this.terminateWorker(workerId);
    }
  }

  getStats(): {
    totalWorkers: number;
    activeWorkers: number;
    queuedTasks: number;
    maxConcurrency: number;
  } {
    return {
      totalWorkers: this.totalWorkerCount,
      activeWorkers: this.activeWorkerCount,
      queuedTasks: this.queuedTaskCount,
      maxConcurrency: this.config.maxConcurrency,
    };
  }
}

export const defaultWorkerPool = new WorkerPool();
