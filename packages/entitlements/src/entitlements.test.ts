import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  entitlementsForPlan,
  FORBIDDEN_ENTITLEMENTS,
  isEntitlementId,
  isPlanId,
  parsePlanId,
} from './catalog.js';
import { EntitlementError } from './errors.js';
import { InMemorySubscriptionDirectory } from './repository.js';
import {
  EntitlementService,
  rejectClientPrivilegePatch,
  requireOwnedUserId,
} from './service.js';

describe('plan catalog', () => {
  it('has stable plan identifiers and rejects unknown plans', () => {
    assert.equal(isPlanId('FREE'), true);
    assert.equal(isPlanId('PRO'), true);
    assert.equal(isPlanId('AI'), true);
    assert.equal(isPlanId('ADVANCED'), true);
    assert.equal(isPlanId('ENTERPRISE'), true);
    assert.equal(isPlanId('GOD'), false);
    assert.throws(() => parsePlanId('GOD'), /Invalid plan/);
  });

  it('maps FREE to safe product entitlements only', () => {
    const free = entitlementsForPlan('FREE');
    assert.deepEqual([...free], ['MARKET_DATA_BASIC', 'PAPER_TRADING']);
    assert.equal(free.includes('MODEL_TRAINING'), false);
  });

  it('never defines live-trading or bypass entitlements', () => {
    for (const id of FORBIDDEN_ENTITLEMENTS) {
      assert.equal(isEntitlementId(id), false);
    }
  });
});

describe('EntitlementService', () => {
  it('defaults new users to FREE', () => {
    const service = new EntitlementService(new InMemorySubscriptionDirectory(), () => 't');
    const view = service.getEntitlements('user-a');
    assert.equal(view.plan, 'FREE');
    assert.equal(view.source, 'default');
    assert.equal(view.liveTradingGrantedBySubscription, false);
    assert.equal(view.riskBypassGrantedBySubscription, false);
    assert.equal(service.hasEntitlement('user-a', 'PAPER_TRADING'), true);
    assert.equal(service.hasEntitlement('user-a', 'BACKTESTING'), false);
  });

  it('assigns PRO internally (MOCK) and still cannot grant live trading', () => {
    const service = new EntitlementService(new InMemorySubscriptionDirectory(), () => 't');
    const view = service.assignPlanForTests('user-a', 'PRO');
    assert.equal(view.plan, 'PRO');
    assert.equal(view.source, 'internal_assignment');
    assert.equal(service.hasEntitlement('user-a', 'BACKTESTING'), true);
    assert.equal(view.liveTradingGrantedBySubscription, false);
    assert.throws(
      () => service.hasEntitlement('user-a', 'LIVE_TRADING_BYPASS'),
      (err: unknown) => err instanceof EntitlementError && err.code === 'INVALID_INPUT',
    );
  });

  it('requires missing entitlements and honors jurisdiction override', () => {
    const service = new EntitlementService(new InMemorySubscriptionDirectory(), () => 't');
    assert.throws(
      () => service.requireEntitlement('user-a', 'AI_ASSISTANT'),
      (err: unknown) => err instanceof EntitlementError && err.code === 'ENTITLEMENT_REQUIRED',
    );
    service.assignPlanForTests('user-a', 'AI');
    service.requireEntitlement('user-a', 'AI_ASSISTANT');
    const blocked = service.evaluateAccess('user-a', 'AI_ASSISTANT', false);
    assert.equal(blocked.entitled, true);
    assert.equal(blocked.available, false);
    assert.equal(blocked.blockedByJurisdiction, true);
  });

  it('rejects invalid plans and unknown entitlements', () => {
    const service = new EntitlementService(new InMemorySubscriptionDirectory(), () => 't');
    assert.throws(() => service.assignPlanForTests('user-a', 'UNLIMITED'), /Invalid plan/);
    assert.throws(() => service.hasEntitlement('user-a', 'NOT_A_THING'), /Unknown entitlement/);
  });
});

describe('ownership and mass assignment', () => {
  it('binds subscription reads to the authenticated principal', () => {
    assert.equal(requireOwnedUserId('user-a', undefined), 'user-a');
    assert.throws(
      () => requireOwnedUserId('user-a', 'user-b'),
      (err: unknown) => err instanceof EntitlementError && err.code === 'FORBIDDEN',
    );
  });

  it('rejects client attempts to set plan, entitlements, role, or live trading', () => {
    assert.throws(() => rejectClientPrivilegePatch({ plan: 'ADVANCED' }), /not writable/);
    assert.throws(() => rejectClientPrivilegePatch({ entitlements: ['LIVE_TRADING'] }), /not writable/);
    assert.throws(() => rejectClientPrivilegePatch({ role: 'admin' }), /not writable/);
    assert.throws(() => rejectClientPrivilegePatch({ liveTradingEnabled: true }), /not writable/);
  });
});
