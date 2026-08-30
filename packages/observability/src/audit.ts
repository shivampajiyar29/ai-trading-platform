import { redactValue } from './redact.js';

export const AUDIT_EVENTS = [
  'AUTH_SUCCESS',
  'AUTH_FAILURE',
  'SESSION_CREATED',
  'SESSION_REVOKED',
  'AUTHORIZATION_DENIED',
  'PROFILE_UPDATED',
  'SETTINGS_UPDATED',
  'ENTITLEMENT_CHANGED',
  'SUBSCRIPTION_ASSIGNED',
] as const;

export type AuditEventType = (typeof AUDIT_EVENTS)[number];

export type AuditEvent = {
  timestamp: string;
  type: AuditEventType;
  actorId: string;
  correlationId?: string;
  outcome: 'success' | 'denied' | 'failure';
  details: Record<string, unknown>;
};

export type AuditSink = {
  record(
    type: AuditEventType,
    actorId: string,
    outcome: AuditEvent['outcome'],
    details?: Record<string, unknown>,
    correlationId?: string,
  ): AuditEvent;
};

export class AuditLog implements AuditSink {
  readonly events: AuditEvent[] = [];

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  record(
    type: AuditEventType,
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
