import { Task, TaskResult, WorkerPoolConfig } from './types';
import { WorkerPool, DEFAULT_WORKER_POOL_CONFIG } from './worker-pool';

export interface SchedulerConfig extends WorkerPoolConfig {
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  ...DEFAULT_WORKER_POOL_CONFIG,
  maxRetries: 3,
  retryDelayMs: 1000,
};

interface ScheduledTask<T = any> {
  task: Task;
  callback: (result: TaskResult<T>) => void;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface TaskInfo {
  id: string;
  type: string;
  status: TaskStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

export class ConcurrencyScheduler {
  private config: SchedulerConfig;
  private workerPool: WorkerPool;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private taskStatus: Map<string, TaskInfo> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.workerPool = new WorkerPool({
      maxConcurrency: this.config.maxConcurrency,
      workerIdleTimeout: this.config.workerIdleTimeout,
    });
  }

  getStats(): {
    totalWorkers: number;
    activeWorkers: number;
    queuedTasks: number;
    maxConcurrency: number;
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const poolStats = this.workerPool.getStats();

    let runningTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;

    for (const info of this.taskStatus.values()) {
      if (info.status === 'running') runningTasks++;
      if (info.status === 'completed') completedTasks++;
      if (info.status === 'failed') failedTasks++;
    }

    return {
      ...poolStats,
      totalTasks: this.taskStatus.size,
      runningTasks,
      completedTasks,
      failedTasks,
    };
  }

  getTaskInfo(taskId: string): TaskInfo | undefined {
    return this.taskStatus.get(taskId);
  }

  getAllTaskInfos(): TaskInfo[] {
    return Array.from(this.taskStatus.values());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private updateTaskStatus(taskId: string, updates: Partial<TaskInfo>): void {
    const existing = this.taskStatus.get(taskId);
    if (existing) {
      this.taskStatus.set(taskId, { ...existing, ...updates });
      this.notify();
    }
  }

  private async scheduleRetry(taskId: string): Promise<void> {
    const scheduled = this.scheduledTasks.get(taskId);
    if (!scheduled) return;

    if (scheduled.retryCount >= scheduled.maxRetries) {
      this.updateTaskStatus(taskId, {
        status: 'failed',
        error: scheduled.error,
        completedAt: Date.now(),
      });

      scheduled.callback({
        taskId,
        success: false,
        error: scheduled.error,
      });

      this.scheduledTasks.delete(taskId);
      return;
    }

    scheduled.retryCount++;
    this.updateTaskStatus(taskId, {
      status: 'pending',
      retryCount: scheduled.retryCount,
    });

    await new Promise((resolve) => {
      setTimeout(resolve, this.config.retryDelayMs * scheduled.retryCount);
    });

    this.executeScheduledTask(taskId);
  }

  private async executeScheduledTask(taskId: string): Promise<void> {
    const scheduled = this.scheduledTasks.get(taskId);
    if (!scheduled) return;

    this.updateTaskStatus(taskId, {
      status: 'running',
      startedAt: Date.now(),
    });

    const result = await this.workerPool.submit(
      scheduled.task.type,
      scheduled.task.signal,
      scheduled.task.args,
      scheduled.task.priority
    );

    if (result.success) {
      this.updateTaskStatus(taskId, {
        status: 'completed',
        completedAt: Date.now(),
      });

      scheduled.callback(result);
      this.scheduledTasks.delete(taskId);
    } else {
      scheduled.error = result.error;
      this.scheduleRetry(taskId);
    }
  }

  submit<T = any>(
    taskType: string,
    signal: AbortSignal,
    args: any[],
    options: { priority?: number; maxRetries?: number } = {}
  ): Promise<TaskResult<T>> {
    const { priority = 0, maxRetries = this.config.maxRetries } = options;

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: taskType,
      signal,
      args,
      priority,
    };

    const taskInfo: TaskInfo = {
      id: task.id,
      type: taskType,
      status: 'pending',
      retryCount: 0,
      maxRetries,
      createdAt: Date.now(),
    };

    this.taskStatus.set(task.id, taskInfo);

    return new Promise((resolve) => {
      const scheduled: ScheduledTask<T> = {
        task,
        callback: resolve,
        retryCount: 0,
        maxRetries,
      };

      this.scheduledTasks.set(task.id, scheduled);
      this.notify();
      this.executeScheduledTask(task.id);
    });
  }

  cancel(taskId: string): boolean {
    const info = this.taskStatus.get(taskId);
    if (!info || info.status === 'completed' || info.status === 'failed') {
      return false;
    }

    if (this.workerPool.cancelTask(taskId)) {
      this.updateTaskStatus(taskId, {
        status: 'cancelled',
        completedAt: Date.now(),
      });
      this.scheduledTasks.delete(taskId);
      return true;
    }

    return false;
  }

  cancelAll(): void {
    this.workerPool.clearQueue();

    for (const [taskId, info] of this.taskStatus.entries()) {
      if (info.status === 'pending') {
        this.taskStatus.set(taskId, {
          ...info,
          status: 'cancelled',
          completedAt: Date.now(),
        });
        this.scheduledTasks.delete(taskId);
      }
    }

    this.notify();
  }

  terminate(): void {
    this.workerPool.terminateAll();
    this.scheduledTasks.clear();
    this.taskStatus.clear();
    this.notify();
  }
}

export const defaultScheduler = new ConcurrencyScheduler();
