export const CORRELATION_HEADER = 'x-correlation-id';

export function createCorrelationId(now = Date.now, random = Math.random): string {
  return `corr-${now().toString(36)}-${random().toString(36).slice(2, 10)}`;
}

export function resolveCorrelationId(
  incoming: string | undefined,
  now = Date.now,
  random = Math.random,
): string {
  const trimmed = incoming?.trim();
  if (trimmed) {
    return trimmed.slice(0, 128);
  }
  return createCorrelationId(now, random);
}
