interface PerformanceEntry {
  label: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceTracker {
  private static marks = new Map<string, number>();
  private static entries: PerformanceEntry[] = [];
  private static maxEntries = 100;

  static start(label: string): void {
    this.marks.set(label, performance.now());
  }

  static end(label: string, metadata?: Record<string, any>): number | undefined {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`Performance: No start mark for "${label}"`);
      return undefined;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    this.entries.push({ label, startTime, duration, metadata });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    if (duration > 1000) {
      console.warn(`⚠️ Slow: ${label} took ${duration.toFixed(2)}ms`, metadata);
    }

    return duration;
  }

  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label, metadata);
      return result;
    } catch (error) {
      this.end(label, { ...metadata, error: true });
      throw error;
    }
  }

  static getStats(label?: string) {
    const relevantEntries = label
      ? this.entries.filter((e) => e.label === label)
      : this.entries;

    if (relevantEntries.length === 0) return null;

    const durations = relevantEntries
      .map((e) => e.duration)
      .filter((d): d is number => d !== undefined);

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: durations.length,
      avg: avg.toFixed(2),
      median: sorted[Math.floor(sorted.length / 2)].toFixed(2),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      min: Math.min(...durations).toFixed(2),
      max: Math.max(...durations).toFixed(2),
    };
  }

  static clear(): void {
    this.marks.clear();
    this.entries = [];
  }

  static export(): PerformanceEntry[] {
    return [...this.entries];
  }
}

export default PerformanceTracker;

if (typeof window !== 'undefined') {
  (window as any).__PerformanceTracker = PerformanceTracker;
}
