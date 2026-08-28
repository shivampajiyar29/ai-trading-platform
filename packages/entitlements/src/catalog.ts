export const PLANS = ['FREE', 'PRO', 'AI', 'ADVANCED', 'ENTERPRISE'] as const;
export type PlanId = (typeof PLANS)[number];

export const ENTITLEMENTS = [
  'MARKET_DATA_BASIC',
  'MARKET_DATA_ADVANCED',
  'CHARTS_ADVANCED',
  'BACKTESTING',
  'STRATEGY_BUILDER',
  'AI_ASSISTANT',
  'MODEL_TRAINING',
  'PERSONAL_AI_AGENT',
  'PAPER_TRADING',
  'ADVANCED_ANALYTICS',
] as const;
export type EntitlementId = (typeof ENTITLEMENTS)[number];

/** Identifiers that must never exist as product entitlements. */
export const FORBIDDEN_ENTITLEMENTS = [
  'LIVE_TRADING',
  'LIVE_TRADING_BYPASS',
  'RISK_BYPASS',
  'COMPLIANCE_BYPASS',
  'AUTH_BYPASS',
] as const;

const FREE_ENTITLEMENTS: readonly EntitlementId[] = ['MARKET_DATA_BASIC', 'PAPER_TRADING'];
const PRO_ENTITLEMENTS: readonly EntitlementId[] = [
  ...FREE_ENTITLEMENTS,
  'CHARTS_ADVANCED',
  'BACKTESTING',
  'STRATEGY_BUILDER',
  'ADVANCED_ANALYTICS',
];
const AI_ENTITLEMENTS: readonly EntitlementId[] = [...PRO_ENTITLEMENTS, 'AI_ASSISTANT'];
const ADVANCED_ENTITLEMENTS: readonly EntitlementId[] = [
  ...AI_ENTITLEMENTS,
  'MARKET_DATA_ADVANCED',
  'MODEL_TRAINING',
  'PERSONAL_AI_AGENT',
];

const PLAN_ENTITLEMENTS: Record<PlanId, readonly EntitlementId[]> = {
  FREE: FREE_ENTITLEMENTS,
  PRO: PRO_ENTITLEMENTS,
  AI: AI_ENTITLEMENTS,
  ADVANCED: ADVANCED_ENTITLEMENTS,
  ENTERPRISE: ADVANCED_ENTITLEMENTS,
};

export function isPlanId(value: string): value is PlanId {
  return (PLANS as readonly string[]).includes(value);
}

export function isEntitlementId(value: string): value is EntitlementId {
  return (ENTITLEMENTS as readonly string[]).includes(value);
}

export function isForbiddenEntitlement(value: string): boolean {
  return (FORBIDDEN_ENTITLEMENTS as readonly string[]).includes(value);
}

export function entitlementsForPlan(plan: PlanId): readonly EntitlementId[] {
  return PLAN_ENTITLEMENTS[plan];
}

export function parsePlanId(value: string): PlanId {
  const normalized = value.trim().toUpperCase();
  if (!isPlanId(normalized)) {
    throw new Error(`Invalid plan: ${value}`);
  }
  return normalized;
}
