/**
 * Disposable C15 observer. It is enabled only by ?ben2-cancellation-audit and
 * records production-path state; it never aborts, starts, or terminates work.
 */
interface AuditEvent {
  sequence: number;
  wallTime: string;
  performanceMs: number;
  event: string;
  details: Record<string, unknown>;
}

function enabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URL(window.location.href).searchParams.has('ben2-cancellation-audit')
  );
}

export function ben2CancellationAudit(
  event: string,
  details: Record<string, unknown> = {},
): void {
  if (!enabled()) return;
  const host = window as any;
  const events = (host.__squooshBen2CancellationEvents ||= []) as AuditEvent[];
  events.push({
    sequence: events.length + 1,
    wallTime: new Date().toISOString(),
    performanceMs: performance.now(),
    event,
    details,
  });
}

export function ben2CancellationReason(reason: unknown): string | undefined {
  if (reason === undefined) return undefined;
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  return String(reason);
}
