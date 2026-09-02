export type SecurityHeaders = Record<string, string>;

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-xss-protection': '0',
  'content-security-policy': "default-src 'self'; base-uri 'self'; frame-ancestors 'none'",
};

export function applySecurityHeaders(headers: Record<string, string>): Record<string, string> {
  const result = { ...headers };
  for (const [key, value] of Object.entries(DEFAULT_SECURITY_HEADERS)) {
    if (!Object.keys(result).some((existing) => existing.toLowerCase() === key)) result[key] = value;
  }
  return result;
}

export function rateLimitHeaders(headers: Record<string, string>, remaining: number, retryAfterSeconds = 0): Record<string, string> {
  const result = { ...headers, 'x-ratelimit-remaining': String(Math.max(0, remaining)) };
  if (retryAfterSeconds > 0) result['retry-after'] = String(retryAfterSeconds);
  return result;
}
