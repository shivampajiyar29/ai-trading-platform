import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AUDIT_EVENTS, AuditLog } from './audit.js';
import { createUuidV4, isSafeCorrelationId, isUuidV4, resolveCorrelationId } from './correlation-id.js';
import { StructuredLogger } from './logger.js';
import { HTTP_REQUESTS, InMemoryMetrics, TRADING_METRIC_NAMES } from './metrics.js';
import { redactValue } from './redact.js';
import { TraceProvider } from './spans.js';
import { PlatformTelemetry } from './telemetry.js';

describe('redaction', () => {
  it('strips tokens, passwords, and authorization headers', () => {
    const redacted = redactValue({
      authorization: 'Bearer sess_deadbeefdeadbeefdeadbeefdeadbeef',
      password: 'correct-horse',
      token: 'abc',
      apiKey: 'k',
      note: 'ok',
    }) as Record<string, unknown>;
    assert.equal(redacted.authorization, '[REDACTED]');
    assert.equal(redacted.password, '[REDACTED]');
    assert.equal(redacted.token, '[REDACTED]');
    assert.equal(redacted.note, 'ok');
    assert.match(String(redactValue('Bearer abcdefghijklmnop')), /REDACTED/);
  });
});

describe('correlation', () => {
  it('generates UUID v4 when missing', () => {
    const created = resolveCorrelationId(undefined, undefined);
    assert.equal(isUuidV4(created), true);
    assert.equal(isUuidV4(createUuidV4()), true);
  });

  it('reuses X-Correlation-ID and falls back to x-request-id', () => {
    assert.equal(resolveCorrelationId(' abc-123 ', 'ignored'), 'abc-123');
    assert.equal(resolveCorrelationId(undefined, 'req-9'), 'req-9');
  });

  it('rejects unsafe or oversized ids', () => {
    assert.equal(isSafeCorrelationId('ok'), true);
    assert.equal(isSafeCorrelationId('bad\nid'), false);
    assert.equal(isSafeCorrelationId('x'.repeat(129)), false);
    const replaced = resolveCorrelationId('line1\nline2');
    assert.equal(replaced.includes('\n'), false);
  });
});

describe('logger and audit', () => {
  it('writes structured JSON with level, timestamp, and correlation id', () => {
    const logger = new StructuredLogger('api-gateway', 'info', undefined, () => '2026-08-30T00:00:00.000Z');
    logger.child('corr-1').info('http.request', { path: '/health', userId: 'user-1', role: 'user' });
    assert.equal(logger.records[0]?.correlationId, 'corr-1');
    assert.equal(logger.records[0]?.level, 'INFO');
    assert.equal(logger.records[0]?.timestamp, '2026-08-30T00:00:00.000Z');
    const parsed = JSON.parse(logger.toJsonLines()) as { level: string; message: string };
    assert.equal(parsed.level, 'INFO');
    assert.equal(parsed.message, 'http.request');
  });

  it('records each audit event type without leaking secrets', () => {
    const audit = new AuditLog(() => 't');
    for (const type of AUDIT_EVENTS) {
      audit.record(type, 'user-a', 'success', { authorization: 'Bearer secret-token-value-here' }, 'c1');
    }
    assert.equal(audit.events.length, AUDIT_EVENTS.length);
    assert.equal(audit.events[0]?.correlationId, 'c1');
    assert.equal(audit.events[0]?.timestamp, 't');
    assert.equal(audit.events.every((event) => event.details.authorization === '[REDACTED]'), true);
  });
});

describe('metrics and telemetry', () => {
  it('supports counter, gauge, and histogram', () => {
    const metrics = new InMemoryMetrics();
    metrics.counter(HTTP_REQUESTS, { method: 'GET', path: '/health', status: '200' });
    metrics.gauge('process.uptime_seconds', 12);
    metrics.histogram('http.request_duration_ms', 4, { method: 'GET', path: '/health', status: '200' });
    assert.equal(metrics.counterValue(HTTP_REQUESTS, { method: 'GET', path: '/health', status: '200' }), 1);
    assert.equal(metrics.counterValue('process.uptime_seconds'), 12);
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

describe('tracing', () => {
  it('creates spans with tags, events, and end', () => {
    const traces = new TraceProvider(() => 10, () => 'id1');
    const span = traces.startSpan('http.request');
    span.addTag('path', '/health');
    span.addEvent('handler.start');
    span.end();
    assert.equal(span.name, 'http.request');
    assert.equal(span.attributes.path, '/health');
    assert.equal(span.events[0]?.name, 'handler.start');
    assert.equal(span.endMs, 10);
  });
});
