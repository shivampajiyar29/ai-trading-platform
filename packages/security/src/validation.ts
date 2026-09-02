export type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

export const DEFAULT_MAX_BODY_BYTES = 1_048_576;
export const DEFAULT_MAX_STRING_LENGTH = 4096;

export function validateString(value: unknown, options: { maxLength?: number; field?: string; trim?: boolean } = {}): ValidationResult<string> {
  if (typeof value !== 'string') return { ok: false, code: 'INVALID_STRING', message: `${options.field ?? 'value'} must be a string` };
  const max = options.maxLength ?? DEFAULT_MAX_STRING_LENGTH;
  if (value.length > max) return { ok: false, code: 'STRING_TOO_LONG', message: `${options.field ?? 'value'} exceeds maximum length` };
  if (options.trim !== false && value.trim().length === 0) return { ok: false, code: 'EMPTY_STRING', message: `${options.field ?? 'value'} must not be empty` };
  return { ok: true, value: options.trim === false ? value : value.trim() };
}

export function validateEmail(value: unknown): ValidationResult<string> {
  const result = validateString(value, { field: 'email', maxLength: 320 });
  if (!result.ok) return result;
  const email = result.value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, code: 'INVALID_EMAIL', message: 'email is invalid' };
  return { ok: true, value: email };
}

export function validatePositiveNumber(value: unknown, field = 'value'): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return { ok: false, code: 'INVALID_NUMBER', message: `${field} must be a finite positive number` };
  return { ok: true, value };
}

export function validatePlainObject(value: unknown, field = 'body'): ValidationResult<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, code: 'INVALID_OBJECT', message: `${field} must be an object` };
  return { ok: true, value: value as Record<string, unknown> };
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function estimateJsonBytes(value: unknown): number {
  try { return utf8ByteLength(JSON.stringify(value)); } catch { return Number.POSITIVE_INFINITY; }
}

export function validateBodySize(value: unknown, maxBytes = DEFAULT_MAX_BODY_BYTES): ValidationResult<unknown> {
  const bytes = estimateJsonBytes(value);
  if (!Number.isFinite(maxBytes) || maxBytes <= 0 || bytes > maxBytes) return { ok: false, code: 'REQUEST_TOO_LARGE', message: 'Request body exceeds maximum size' };
  return { ok: true, value };
}

export function validateSafeJson(value: unknown, maxDepth = 8): ValidationResult<unknown> {
  const seen = new Set<object>();
  const walk = (node: unknown, depth: number): boolean => {
    if (depth > maxDepth) return false;
    if (!node || typeof node !== 'object') return true;
    if (seen.has(node)) return false;
    seen.add(node);
    if (Array.isArray(node)) return node.every((item) => walk(item, depth + 1));
    return Object.entries(node as Record<string, unknown>).every(([key, child]) => key.length <= DEFAULT_MAX_STRING_LENGTH && walk(child, depth + 1));
  };
  if (!walk(value, 0)) return { ok: false, code: 'UNSAFE_JSON', message: 'Request contains unsafe or excessively nested JSON' };
  return { ok: true, value };
}
