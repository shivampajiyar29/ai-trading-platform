const SENSITIVE_KEY =
  /^(authorization|password|passwd|secret|token|api[-_]?key|cookie|set-cookie|broker[-_]?key|private[-_]?key)$/i;

const TOKENISH = /\b(Bearer\s+)?[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const GITHUB_PAT = /\b(ghp|github_pat)_[A-Za-z0-9_]+\b/g;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export function redactText(value: string): string {
  return value
    .replace(BEARER, 'Bearer [REDACTED]')
    .replace(GITHUB_PAT, '[REDACTED]')
    .replace(TOKENISH, '[REDACTED]');
}

export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? '[REDACTED]' : redactValue(nested);
    }
    return out;
  }
  return value;
}
