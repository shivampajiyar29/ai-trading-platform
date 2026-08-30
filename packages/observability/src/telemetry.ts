import { AuditLog } from './audit.js';
import { StructuredLogger } from './logger.js';
import {
  HTTP_ERRORS,
  HTTP_REQUEST_DURATION_MS,
  HTTP_REQUESTS,
  InMemoryMetrics,
} from './metrics.js';
import { InMemoryTracer } from './trace.js';

export type RequestTelemetryInput = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  correlationId: string;
  principalId?: string;
  principalRole?: string;
};

export class PlatformTelemetry {
  readonly logger: StructuredLogger;
  readonly metrics: InMemoryMetrics;
  readonly tracer: InMemoryTracer;
  readonly audit: AuditLog;

  constructor(service = 'api-gateway') {
    this.logger = new StructuredLogger(service);
    this.metrics = new InMemoryMetrics();
    this.tracer = new InMemoryTracer();
    this.audit = new AuditLog();
  }

  recordRequest(input: RequestTelemetryInput): void {
    const labels = {
      method: input.method,
      path: input.path,
      status: String(input.status),
    };
    this.metrics.increment(HTTP_REQUESTS, labels);
    this.metrics.observe(HTTP_REQUEST_DURATION_MS, input.durationMs, labels);
    if (input.status >= 400) {
      this.metrics.increment(HTTP_ERRORS, { status: String(input.status) });
    }
    const level = input.status >= 500 ? 'error' : input.status >= 400 ? 'warn' : 'info';
    this.logger.log(
      level,
      'http.request',
      {
        method: input.method,
        path: input.path,
        status: input.status,
        durationMs: input.durationMs,
        principalId: input.principalId,
        principalRole: input.principalRole,
      },
      input.correlationId,
    );
  }
}
