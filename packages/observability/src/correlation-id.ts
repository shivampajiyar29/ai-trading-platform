const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNSAFE = /[\r\n\0<>]/;

export const CORRELATION_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
export const MAX_CORRELATION_ID_LENGTH = 128;

export function createUuidV4(): string {
  const cryptoRef = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  const b6 = bytes[6] ?? 0;
  const b8 = bytes[8] ?? 0;
  bytes[6] = (b6 & 0x0f) | 0x40;
  bytes[8] = (b8 & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isSafeCorrelationId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_CORRELATION_ID_LENGTH) {
    return false;
  }
  if (UNSAFE.test(trimmed)) {
    return false;
  }
  return true;
}

export function isUuidV4(value: string): boolean {
  return UUID_V4.test(value);
}

export function resolveCorrelationId(
  incomingCorrelationId?: string,
  incomingRequestId?: string,
): string {
  for (const candidate of [incomingCorrelationId, incomingRequestId]) {
    const trimmed = candidate?.trim();
    if (trimmed && isSafeCorrelationId(trimmed)) {
      return trimmed;
    }
  }
  return createUuidV4();
}

export { createUuidV4 as createCorrelationId };
