import { redactValue } from './redact.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'debug' | 'info' | 'warn' | 'error';

export type LogRecord = {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId?: string;
  fields: Record<string, unknown>;
};

export type LogSink = (record: LogRecord) => void;

const LEVEL_RANK: Record<string, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

export function normalizeLogLevel(level: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' {
  const upper = level.toUpperCase();
  if (upper === 'DEBUG' || upper === 'INFO' || upper === 'WARN' || upper === 'ERROR') {
    return upper;
  }
  return 'INFO';
}

export class StructuredLogger {
  readonly records: LogRecord[] = [];

  constructor(
    private readonly service: string,
    private readonly minLevel: LogLevel = 'info',
    private readonly sink?: LogSink,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  child(correlationId: string): RequestLogger {
    return new RequestLogger(this, correlationId);
  }

  log(level: LogLevel, message: string, fields: Record<string, unknown> = {}, correlationId?: string): void {
    if ((LEVEL_RANK[level] ?? 20) < (LEVEL_RANK[this.minLevel] ?? 20)) {
      return;
    }
    const record: LogRecord = {
      timestamp: this.now(),
      level: normalizeLogLevel(level),
      message,
      service: this.service,
      fields: redactValue(fields) as Record<string, unknown>,
    };
    if (correlationId !== undefined) {
      record.correlationId = correlationId;
    }
    this.records.push(record);
    this.sink?.(record);
  }

  info(message: string, fields?: Record<string, unknown>, correlationId?: string): void {
    this.log('info', message, fields ?? {}, correlationId);
  }

  warn(message: string, fields?: Record<string, unknown>, correlationId?: string): void {
    this.log('warn', message, fields ?? {}, correlationId);
  }

  error(message: string, fields?: Record<string, unknown>, correlationId?: string): void {
    this.log('error', message, fields ?? {}, correlationId);
  }

  toJsonLines(): string {
    return this.records.map((record) => JSON.stringify(record)).join('\n');
  }
}

export class RequestLogger {
  constructor(
    private readonly root: StructuredLogger,
    readonly correlationId: string,
  ) {}

  info(message: string, fields?: Record<string, unknown>): void {
    this.root.info(message, fields, this.correlationId);
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.root.warn(message, fields, this.correlationId);
  }

  error(message: string, fields?: Record<string, unknown>): void {
    this.root.error(message, fields, this.correlationId);
  }
}
