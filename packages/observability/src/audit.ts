import { redactValue } from './redact.js';

export type AuditEvent = {
  timestamp: string;
  type: string;
  actorId: string;
  correlationId?: string;
  outcome: 'success' | 'denied' | 'failure';
  details: Record<string, unknown>;
};

export class AuditLog {
  readonly events: AuditEvent[] = [];

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  record(
    type: string,
    actorId: string,
    outcome: AuditEvent['outcome'],
    details: Record<string, unknown> = {},
    correlationId?: string,
  ): AuditEvent {
    const event: AuditEvent = {
      timestamp: this.now(),
      type,
      actorId,
      outcome,
      details: redactValue(details) as Record<string, unknown>,
    };
    if (correlationId !== undefined) {
      event.correlationId = correlationId;
    }
    this.events.push(event);
    return event;
  }
}
