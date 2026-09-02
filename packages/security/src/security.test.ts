import assert from 'node:assert/strict';
import test from 'node:test';
import { TokenBucketRateLimiter } from './rate-limit.js';
import { applySecurityHeaders } from './headers.js';
import { validateBodySize, validateEmail, validateSafeJson, validateString } from './validation.js';

test('token bucket allows capacity then throttles and refills', () => {
  let now = 0;
  const limiter = new TokenBucketRateLimiter({ capacity: 2, refillPerSecond: 1, now: () => now });
  assert.equal(limiter.check('user').allowed, true);
  assert.equal(limiter.check('user').allowed, true);
  const blocked = limiter.check('user');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
  now = 1000;
  assert.equal(limiter.check('user').allowed, true);
});

test('rate limits are isolated by key and resettable', () => {
  const limiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 1, now: () => 0 });
  assert.equal(limiter.check('a').allowed, true);
  assert.equal(limiter.check('a').allowed, false);
  assert.equal(limiter.check('b').allowed, true);
  limiter.reset('a');
  assert.equal(limiter.check('a').allowed, true);
});

test('security headers include baseline browser protections', () => {
  const headers = applySecurityHeaders({ 'content-type': 'application/json' });
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['content-security-policy'], "default-src 'self'; base-uri 'self'; frame-ancestors 'none'");
});

test('security headers preserve caller overrides', () => {
  const headers = applySecurityHeaders({ 'X-Frame-Options': 'SAMEORIGIN' });
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(Object.keys(headers).filter((k) => k.toLowerCase() === 'x-frame-options').length, 1);
});

test('validation rejects invalid and oversized values', () => {
  assert.equal(validateString('   ', { field: 'name' }).ok, false);
  assert.equal(validateEmail('not-an-email').ok, false);
  assert.equal(validateEmail('User@example.com').ok, true);
  assert.equal(validateBodySize('12345', 2).ok, false);
  assert.equal(validateBodySize({ ok: true }, 100).ok, true);
});

test('safe JSON rejects cycles and excessive nesting', () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.equal(validateSafeJson(cyclic).ok, false);
  let nested: unknown = {};
  for (let i = 0; i < 10; i += 1) nested = { nested };
  assert.equal(validateSafeJson(nested, 4).ok, false);
});
