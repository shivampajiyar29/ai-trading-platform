export type SecurityAudit = {
  record(
    type: string,
    actorId: string,
    outcome: 'success' | 'denied' | 'failure',
    details?: Record<string, unknown>,
  ): void;
};
