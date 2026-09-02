import assert from 'node:assert/strict';
import test from 'node:test';
import { TokenBucketRateLimiter } from '@ai-trading-platform/security';
import { handleRequest, type GatewayConfig } from './handle-request.js';

const config: GatewayConfig = {
  serviceName: 'test-gateway', version: 'test', tradingMode: 'paper', liveTradingEnabled: false, killSwitchActive: true,
};
const users = { getProfile: () => ({ id: 'user-1' }), updateProfile: () => ({}), getSettings: () => ({}), updateSettings: () => ({}) };
const auth = {
  authenticate: () => ({ id: 'user-1', role: 'user' as const }),
  can: (_principal: { id: string; role: 'anonymous' | 'user' | 'admin' }, permission: string) => permission === 'account:read' || permission === 'account:write',
};

test('security headers are present on normal responses', () => {
  const response = handleRequest({ method: 'GET', path: '/health' }, config);
  assert.equal(response.status, 200);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.equal(response.headers['content-security-policy'], "default-src 'self'; base-uri 'self'; frame-ancestors 'none'");
});

test('oversized and unsafe JSON bodies are rejected before handlers', () => {
  const oversized = handleRequest({ method: 'PATCH', path: '/v1/profile', body: { value: 'x'.repeat(100) } }, config, auth, users, undefined, undefined, { maxBodyBytes: 20 });
  assert.equal(oversized.status, 413);
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  const unsafe = handleRequest({ method: 'PATCH', path: '/v1/profile', body: cyclic }, config, auth, users);
  assert.equal(unsafe.status, 400);
});

test('sensitive protected route is rate limited with retry guidance', () => {
  const limiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 1, now: () => 0 });
  const first = handleRequest({ method: 'GET', path: '/v1/profile', headers: { authorization: 'Bearer valid' } }, config, auth, users, undefined, undefined, { rateLimiter: limiter });
  assert.equal(first.status, 200);
  const second = handleRequest({ method: 'GET', path: '/v1/profile', headers: { authorization: 'Bearer valid' } }, config, auth, users, undefined, undefined, { rateLimiter: limiter });
  assert.equal(second.status, 429);
  assert.equal(second.headers['retry-after'], '1');
});

test('security integration does not add an order route', () => {
  const response = handleRequest({ method: 'POST', path: '/v1/orders', body: { symbol: 'AAPL' } }, config);
  assert.equal(response.status, 404);
});
