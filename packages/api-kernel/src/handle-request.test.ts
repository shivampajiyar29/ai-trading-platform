import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from './handle-request.js';

const baseConfig = {
  serviceName: 'api-gateway',
  version: '0.1.0',
  tradingMode: 'paper' as const,
  liveTradingEnabled: false,
  killSwitchActive: false,
};

describe('handleRequest', () => {
  it('returns health without enabling live trading', () => {
    const res = handleRequest({ method: 'GET', path: '/health' }, baseConfig);
    assert.equal(res.status, 200);
    const body = res.body as { status: string; liveTradingEnabled: boolean };
    assert.equal(body.status, 'ok');
    assert.equal(body.liveTradingEnabled, false);
    assert.equal(res.headers['content-type'], 'application/json');
    assert.ok(res.headers['x-correlation-id']);
  });

  it('propagates incoming correlation id', () => {
    const res = handleRequest(
      { method: 'GET', path: '/health', headers: { 'X-Correlation-Id': 'abc-123' } },
      baseConfig,
    );
    assert.equal(res.headers['x-correlation-id'], 'abc-123');
  });

  it('exposes readiness and execution policy without order routes', () => {
    const ready = handleRequest({ method: 'GET', path: '/ready' }, baseConfig);
    assert.equal(ready.status, 200);
    const readyBody = ready.body as { tradingMode: string; killSwitchActive: boolean };
    assert.equal(readyBody.tradingMode, 'paper');
    assert.equal(readyBody.killSwitchActive, false);

    const policy = handleRequest({ method: 'GET', path: '/v1/execution/policy' }, baseConfig);
    assert.equal(policy.status, 200);
    const policyBody = policy.body as { paperIsolatedFromLive: boolean; liveTradingEnabled: boolean };
    assert.equal(policyBody.paperIsolatedFromLive, true);
    assert.equal(policyBody.liveTradingEnabled, false);
  });

  it('returns 404 for unknown and trading-execution routes (not implemented)', () => {
    const missing = handleRequest({ method: 'GET', path: '/nope' }, baseConfig);
    assert.equal(missing.status, 404);
    const body = missing.body as { error: { code: string } };
    assert.equal(body.error.code, 'NOT_FOUND');

    const order = handleRequest({ method: 'POST', path: '/v1/orders' }, baseConfig);
    assert.equal(order.status, 404);
  });
});
