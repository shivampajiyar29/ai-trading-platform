import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditLog } from './audit.js';
import { resolveCorrelationId } from './correlation.js';
import { StructuredLogger } from './logger.js';
import { HTTP_REQUESTS, InMemoryMetrics, TRADING_METRIC_NAMES } from './metrics.js';
import { redactValue } from './redact.js';
import { PlatformTelemetry } from './telemetry.js';

describe('redaction', () => {
  it('strips tokens, passwords, and authorization headers', () => {
    const redacted = redactValue({
      authorization: 'Bearer sess_deadbeefdeadbeefdeadbeefdeadbeef',
      password: 'correct-horse',
      note: 'ok',
    }) as Record<string, unknown>;
    assert.equal(redacted.authorization, '[REDACTED]');
    assert.equal(redacted.password, '[REDACTED]');
    assert.equal(redacted.note, 'ok');
    assert.match(String(redactValue('Bearer abcdefghijklmnop')), /REDACTED/);
  });
});

describe('correlation', () => {
  it('reuses an incoming id and creates one when missing', () => {
    assert.equal(resolveCorrelationId(' abc-123 '), 'abc-123');
    const created = resolveCorrelationId(undefined, () => 1, () => 0.5);
    assert.match(created, /^corr-/);
  });
});

describe('logger and audit', () => {
  it('writes structured records with correlation ids', () => {
    const logger = new StructuredLogger('api-gateway', 'info', undefined, () => 't');
    logger.child('corr-1').info('http.request', { path: '/health' });
    assert.equal(logger.records[0]?.correlationId, 'corr-1');
    assert.equal(logger.records[0]?.fields.path, '/health');
    const line = logger.toJsonLines();
    assert.match(line, /"level":"info"/);
  });

  it('records security events without leaking secrets', () => {
    const audit = new AuditLog(() => 't');
    audit.record('auth.denied', 'anonymous', 'denied', { authorization: 'Bearer secret-token-value-here' }, 'c1');
    assert.equal(audit.events[0]?.details.authorization, '[REDACTED]');
  });
});

describe('metrics and telemetry', () => {
  it('counts requests and observes duration', () => {
    const metrics = new InMemoryMetrics();
    metrics.increment(HTTP_REQUESTS, { method: 'GET', path: '/health', status: '200' });
    metrics.observe('http.request_duration_ms', 4, { method: 'GET', path: '/health', status: '200' });
    assert.equal(metrics.counterValue(HTTP_REQUESTS, { method: 'GET', path: '/health', status: '200' }), 1);
    assert.equal(metrics.snapshot().histograms[0]?.count, 1);
  });

  it('reserves trading metric names without enabling live trading', () => {
    assert.equal(TRADING_METRIC_NAMES.rejectedOrders, 'trading.rejected_orders');
    const telemetry = new PlatformTelemetry('api-gateway');
    telemetry.recordRequest({
      method: 'GET',
      path: '/health',
      status: 200,
      durationMs: 1,
      correlationId: 'c1',
      principalRole: 'anonymous',
    });
    assert.equal(telemetry.metrics.snapshot().counters.length > 0, true);
    assert.equal(telemetry.metrics.counterValue(TRADING_METRIC_NAMES.rejectedOrders), 0);
  });
});
