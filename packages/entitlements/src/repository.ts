import type { PlanId } from './catalog.js';

export type AssignmentSource = 'default' | 'internal_assignment';

export type SubscriptionRecord = {
  userId: string;
  plan: PlanId;
  source: AssignmentSource;
  assignedAt: string;
};

export interface SubscriptionDirectory {
  get(userId: string): SubscriptionRecord | undefined;
  save(record: SubscriptionRecord): SubscriptionRecord;
}

export class InMemorySubscriptionDirectory implements SubscriptionDirectory {
  private readonly records = new Map<string, SubscriptionRecord>();

  get(userId: string): SubscriptionRecord | undefined {
    const found = this.records.get(userId);
    return found ? { ...found } : undefined;
  }

  save(record: SubscriptionRecord): SubscriptionRecord {
    this.records.set(record.userId, { ...record });
    return { ...record };
  }
}
