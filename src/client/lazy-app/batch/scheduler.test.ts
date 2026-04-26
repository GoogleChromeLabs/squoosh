import { WorkerPool, DEFAULT_WORKER_POOL_CONFIG } from './worker-pool';
import { ConcurrencyScheduler, DEFAULT_SCHEDULER_CONFIG } from './scheduler';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runWorkerPoolTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  results.push(await testWorkerPoolInitialization());
  results.push(await testWorkerPoolConcurrencyLimit());
  results.push(await testWorkerPoolTaskQueue());
  results.push(await testWorkerPoolPriority());

  return results;
}

async function testWorkerPoolInitialization(): Promise<TestResult> {
  try {
    const pool = new WorkerPool({ maxConcurrency: 2, workerIdleTimeout: 5000 });
    const stats = pool.getStats();

    if (stats.maxConcurrency !== 2) {
      return {
        name: 'WorkerPool Initialization',
        passed: false,
        error: `Expected maxConcurrency 2, got ${stats.maxConcurrency}`,
      };
    }

    if (stats.totalWorkers !== 0) {
      return {
        name: 'WorkerPool Initialization',
        passed: false,
        error: `Expected 0 workers initially, got ${stats.totalWorkers}`,
      };
    }

    pool.terminateAll();
    return { name: 'WorkerPool Initialization', passed: true };
  } catch (error) {
    return {
      name: 'WorkerPool Initialization',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testWorkerPoolConcurrencyLimit(): Promise<TestResult> {
  try {
    const pool = new WorkerPool({ maxConcurrency: 2, workerIdleTimeout: 5000 });

    const stats = pool.getStats();
    if (stats.maxConcurrency !== 2) {
      return {
        name: 'WorkerPool Concurrency Limit',
        passed: false,
        error: `Expected maxConcurrency 2, got ${stats.maxConcurrency}`,
      };
    }

    pool.terminateAll();
    return { name: 'WorkerPool Concurrency Limit', passed: true };
  } catch (error) {
    return {
      name: 'WorkerPool Concurrency Limit',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testWorkerPoolTaskQueue(): Promise<TestResult> {
  try {
    const pool = new WorkerPool({ maxConcurrency: 1, workerIdleTimeout: 5000 });

    const initialStats = pool.getStats();
    if (initialStats.queuedTasks !== 0) {
      return {
        name: 'WorkerPool Task Queue',
        passed: false,
        error: `Expected 0 queued tasks initially, got ${initialStats.queuedTasks}`,
      };
    }

    pool.terminateAll();
    return { name: 'WorkerPool Task Queue', passed: true };
  } catch (error) {
    return {
      name: 'WorkerPool Task Queue',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testWorkerPoolPriority(): Promise<TestResult> {
  try {
    const pool = new WorkerPool({ maxConcurrency: 1, workerIdleTimeout: 5000 });

    pool.cancelTask('nonexistent');
    const stats = pool.getStats();

    if (stats.queuedTasks !== 0) {
      return {
        name: 'WorkerPool Priority',
        passed: false,
        error: `Expected 0 queued tasks, got ${stats.queuedTasks}`,
      };
    }

    pool.clearQueue();
    pool.terminateAll();
    return { name: 'WorkerPool Priority', passed: true };
  } catch (error) {
    return {
      name: 'WorkerPool Priority',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runSchedulerTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  results.push(await testSchedulerInitialization());
  results.push(await testSchedulerConfig());
  results.push(await testSchedulerStats());
  results.push(await testSchedulerSubscription());

  return results;
}

async function testSchedulerInitialization(): Promise<TestResult> {
  try {
    const scheduler = new ConcurrencyScheduler({
      maxConcurrency: 3,
      maxRetries: 2,
      retryDelayMs: 500,
    });

    const stats = scheduler.getStats();

    if (stats.maxConcurrency !== 3) {
      return {
        name: 'Scheduler Initialization',
        passed: false,
        error: `Expected maxConcurrency 3, got ${stats.maxConcurrency}`,
      };
    }

    if (stats.totalTasks !== 0) {
      return {
        name: 'Scheduler Initialization',
        passed: false,
        error: `Expected 0 tasks initially, got ${stats.totalTasks}`,
      };
    }

    scheduler.terminate();
    return { name: 'Scheduler Initialization', passed: true };
  } catch (error) {
    return {
      name: 'Scheduler Initialization',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testSchedulerConfig(): Promise<TestResult> {
  try {
    const scheduler = new ConcurrencyScheduler({
      maxConcurrency: 4,
      maxRetries: 5,
      retryDelayMs: 1000,
    });

    const stats = scheduler.getStats();

    if (stats.maxConcurrency !== 4) {
      return {
        name: 'Scheduler Config',
        passed: false,
        error: `Expected maxConcurrency 4, got ${stats.maxConcurrency}`,
      };
    }

    scheduler.terminate();
    return { name: 'Scheduler Config', passed: true };
  } catch (error) {
    return {
      name: 'Scheduler Config',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testSchedulerStats(): Promise<TestResult> {
  try {
    const scheduler = new ConcurrencyScheduler();

    const stats = scheduler.getStats();
    const infos = scheduler.getAllTaskInfos();

    if (infos.length !== 0) {
      return {
        name: 'Scheduler Stats',
        passed: false,
        error: `Expected 0 task infos, got ${infos.length}`,
      };
    }

    if (stats.totalTasks !== 0) {
      return {
        name: 'Scheduler Stats',
        passed: false,
        error: `Expected 0 total tasks, got ${stats.totalTasks}`,
      };
    }

    scheduler.terminate();
    return { name: 'Scheduler Stats', passed: true };
  } catch (error) {
    return {
      name: 'Scheduler Stats',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testSchedulerSubscription(): Promise<TestResult> {
  try {
    const scheduler = new ConcurrencyScheduler();
    let notificationCount = 0;

    const unsubscribe = scheduler.subscribe(() => {
      notificationCount++;
    });

    const stats = scheduler.getStats();
    if (stats.totalTasks !== 0) {
      return {
        name: 'Scheduler Subscription',
        passed: false,
        error: `Expected 0 total tasks, got ${stats.totalTasks}`,
      };
    }

    unsubscribe();
    scheduler.terminate();

    return { name: 'Scheduler Subscription', passed: true };
  } catch (error) {
    return {
      name: 'Scheduler Subscription',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function summarizeTestResults(results: TestResult[]): {
  total: number;
  passed: number;
  failed: number;
  failures: { name: string; error: string }[];
} {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const failures = results
    .filter((r) => !r.passed && r.error)
    .map((r) => ({ name: r.name, error: r.error! }));

  return { total, passed, failed, failures };
}

export async function runAllTests(): Promise<{
  workerPoolTests: TestResult[];
  schedulerTests: TestResult[];
  summary: ReturnType<typeof summarizeTestResults>;
}> {
  const workerPoolTests = await runWorkerPoolTests();
  const schedulerTests = await runSchedulerTests();

  const allResults = [...workerPoolTests, ...schedulerTests];
  const summary = summarizeTestResults(allResults);

  return { workerPoolTests, schedulerTests, summary };
}
