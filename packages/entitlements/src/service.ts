import {
  entitlementsForPlan,
  isEntitlementId,
  isForbiddenEntitlement,
  parsePlanId,
  type EntitlementId,
  type PlanId,
} from './catalog.js';
import { entitlementRequired, forbidden, invalidInput } from './errors.js';
import type { AssignmentSource, SubscriptionDirectory, SubscriptionRecord } from './repository.js';

export type Clock = () => string;

export type EntitlementAudit = {
  record(type: string, actorId: string, outcome: 'success' | 'denied' | 'failure', details?: Record<string, unknown>): void;
};

export type EntitlementView = {
  userId: string;
  plan: PlanId;
  entitlements: EntitlementId[];
  source: AssignmentSource;
  liveTradingGrantedBySubscription: false;
  riskBypassGrantedBySubscription: false;
  complianceBypassGrantedBySubscription: false;
};

export type FeatureAccess = {
  entitlement: EntitlementId;
  entitled: boolean;
  available: boolean;
  blockedByJurisdiction: boolean;
};

/**
 * Server-side plan assignment only. Not a payment confirmation.
 * Labelled MOCK until a PaymentProvider exists.
 */
export type InternalPlanAssignment = {
  plan: PlanId;
  source: 'internal_assignment';
};

export class EntitlementService {
  constructor(
    private readonly directory: SubscriptionDirectory,
    private readonly now: Clock = () => new Date().toISOString(),
    private readonly audit?: EntitlementAudit,
  ) {}

  getSubscription(userId: string): SubscriptionRecord {
    const id = requireUserId(userId);
    const existing = this.directory.get(id);
    if (existing) {
      return { ...existing };
    }
    return this.directory.save({
      userId: id,
      plan: 'FREE',
      source: 'default',
      assignedAt: this.now(),
    });
  }

  getEntitlements(userId: string): EntitlementView {
    const subscription = this.getSubscription(userId);
    return toView(subscription);
  }

  hasEntitlement(userId: string, entitlement: string): boolean {
    const id = parseEntitlementOrThrow(entitlement);
    return this.getEntitlements(userId).entitlements.includes(id);
  }

  requireEntitlement(userId: string, entitlement: string): void {
    if (!this.hasEntitlement(userId, entitlement)) {
      throw entitlementRequired(entitlement);
    }
  }

  /**
   * MOCK / internal test assignment. Not exposed as a public write API.
   */
  assignPlanForTests(userId: string, plan: string): EntitlementView {
    const id = requireUserId(userId);
    const parsed = parsePlanIdSafe(plan);
    const record = this.directory.save({
      userId: id,
      plan: parsed,
      source: 'internal_assignment',
      assignedAt: this.now(),
    });
    this.audit?.record('SUBSCRIPTION_ASSIGNED', id, 'success', { plan: parsed, source: 'internal_assignment' });
    this.audit?.record('ENTITLEMENT_CHANGED', id, 'success', { plan: parsed });
    return toView(record);
  }

  evaluateAccess(userId: string, entitlement: string, jurisdictionAllows = true): FeatureAccess {
    const id = parseEntitlementOrThrow(entitlement);
    const entitled = this.hasEntitlement(userId, id);
    const blockedByJurisdiction = jurisdictionAllows === false;
    return {
      entitlement: id,
      entitled,
      available: entitled && !blockedByJurisdiction,
      blockedByJurisdiction,
    };
  }
}

export function requireOwnedUserId(principalId: string, requestedUserId: string | undefined): string {
  const owner = requireUserId(principalId);
  if (requestedUserId !== undefined && requestedUserId.trim() !== '' && requestedUserId !== owner) {
    throw forbidden('Cannot access another user subscription');
  }
  return owner;
}

export function rejectClientPrivilegePatch(input: unknown): void {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidInput('Request body must be a JSON object');
  }
  const obj = input as Record<string, unknown>;
  const blocked = [
    'plan',
    'entitlements',
    'role',
    'userId',
    'liveTradingEnabled',
    'liveTradingGrantedBySubscription',
  ];
  for (const key of blocked) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      throw invalidInput(`Field is not writable: ${key}`);
    }
  }
}

function toView(record: SubscriptionRecord): EntitlementView {
  return {
    userId: record.userId,
    plan: record.plan,
    entitlements: [...entitlementsForPlan(record.plan)],
    source: record.source,
    liveTradingGrantedBySubscription: false,
    riskBypassGrantedBySubscription: false,
    complianceBypassGrantedBySubscription: false,
  };
}

function requireUserId(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed || trimmed === 'anonymous') {
    throw forbidden('Subscription requires an authenticated user');
  }
  return trimmed;
}

function parsePlanIdSafe(plan: string): PlanId {
  try {
    return parsePlanId(plan);
  } catch {
    throw invalidInput(`Invalid plan: ${plan}`);
  }
}

function parseEntitlementOrThrow(entitlement: string): EntitlementId {
  const normalized = entitlement.trim().toUpperCase();
  if (isForbiddenEntitlement(normalized)) {
    throw invalidInput(`Entitlement is not allowed: ${normalized}`);
  }
  if (!isEntitlementId(normalized)) {
    throw invalidInput(`Unknown entitlement: ${entitlement}`);
  }
  return normalized;
}
