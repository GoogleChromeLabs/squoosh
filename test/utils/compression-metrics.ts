/**
 * Utilities for measuring and reporting compression metrics
 */

export interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionPercentage: number;
  processingTime: number;
  format: string;
}

export interface QualityMetrics {
  ssim?: number; // Structural Similarity Index Measure
  psnr?: number; // Peak Signal-to-Noise Ratio
  visualQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number,
): number {
  if (originalSize === 0) return 0;
  return compressedSize / originalSize;
}

/**
 * Calculate compression percentage (savings)
 */
export function calculateCompressionPercentage(
  originalSize: number,
  compressedSize: number,
): number {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Measure processing time for an async operation
 */
export async function measureProcessingTime<T>(
  operation: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

/**
 * Generate a compression metrics report
 */
export function generateMetricsReport(metrics: CompressionMetrics[]): string {
  let report = '# Compression Metrics Report\n\n';
  report +=
    '| File | Original Size | Compressed Size | Ratio | Savings | Time (ms) | Format |\n';
  report +=
    '|------|--------------|----------------|-------|---------|-----------|--------|\n';

  for (const metric of metrics) {
    const ratio = metric.compressionRatio.toFixed(2);
    const savings = metric.compressionPercentage.toFixed(1);
    const time = metric.processingTime.toFixed(0);

    report += `| - | ${formatFileSize(metric.originalSize)} | ${formatFileSize(metric.compressedSize)} | ${ratio} | ${savings}% | ${time} | ${metric.format} |\n`;
  }

  // Calculate averages
  const avgRatio =
    metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / metrics.length;
  const avgSavings =
    metrics.reduce((sum, m) => sum + m.compressionPercentage, 0) /
    metrics.length;
  const avgTime =
    metrics.reduce((sum, m) => sum + m.processingTime, 0) / metrics.length;

  report += '\n## Summary\n\n';
  report += `- **Average Compression Ratio:** ${avgRatio.toFixed(2)}\n`;
  report += `- **Average Savings:** ${avgSavings.toFixed(1)}%\n`;
  report += `- **Average Processing Time:** ${avgTime.toFixed(0)}ms\n`;

  return report;
}

/**
 * Compare two compression results
 */
export function compareResults(
  baseline: CompressionMetrics,
  current: CompressionMetrics,
): {
  ratioChange: number;
  timeChange: number;
  isRegression: boolean;
} {
  const ratioChange =
    ((current.compressionRatio - baseline.compressionRatio) /
      baseline.compressionRatio) *
    100;
  const timeChange =
    ((current.processingTime - baseline.processingTime) /
      baseline.processingTime) *
    100;

  // Consider it a regression if compression ratio increased by more than 5%
  // or processing time increased by more than 20%
  const isRegression = ratioChange > 5 || timeChange > 20;

  return {
    ratioChange,
    timeChange,
    isRegression,
  };
}

/**
 * Validate compression quality
 */
export function validateCompressionQuality(
  compressionRatio: number,
  expectedMaxRatio: number = 0.8,
): { valid: boolean; message: string } {
  if (compressionRatio <= expectedMaxRatio) {
    return {
      valid: true,
      message: `Compression ratio ${compressionRatio.toFixed(2)} is within acceptable range`,
    };
  }

  return {
    valid: false,
    message: `Compression ratio ${compressionRatio.toFixed(2)} exceeds maximum ${expectedMaxRatio}`,
  };
}
