export { AuditLog, AUDIT_EVENTS, type AuditEvent, type AuditEventType, type AuditSink } from './audit.js';
export {
  CORRELATION_HEADER,
  REQUEST_ID_HEADER,
  MAX_CORRELATION_ID_LENGTH,
  createCorrelationId,
  createUuidV4,
  isSafeCorrelationId,
  isUuidV4,
  resolveCorrelationId,
} from './correlation-id.js';
export { StructuredLogger, normalizeLogLevel, type LogLevel, type LogRecord } from './logger.js';
export {
  HTTP_ERRORS,
  HTTP_REQUEST_DURATION_MS,
  HTTP_REQUESTS,
  InMemoryMetrics,
  TRADING_METRIC_NAMES,
  type MetricsSnapshot,
} from './metrics.js';
export { isSensitiveKey, redactText, redactValue } from './redact.js';
export { InMemorySpan, TraceProvider, type Span, type SpanEvent } from './spans.js';
export { PlatformTelemetry, type RequestTelemetryInput } from './telemetry.js';
export { InMemoryTracer } from './trace.js';
