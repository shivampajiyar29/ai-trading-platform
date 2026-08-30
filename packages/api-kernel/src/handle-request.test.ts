import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, type GatewayAuth, type GatewayPrincipal } from './handle-request.js';

const baseConfig = {
  serviceName: 'api-gateway',
  version: '0.1.0',
  tradingMode: 'paper' as const,
  liveTradingEnabled: false,
  killSwitchActive: false,
};

const principals: Record<string, GatewayPrincipal> = {
  user: { id: 'user-1', role: 'user' },
  userB: { id: 'user-2', role: 'user' },
  admin: { id: 'admin-1', role: 'admin' },
};

const auth: GatewayAuth = {
  authenticate(authorizationHeader) {
    if (!authorizationHeader) {
      return { id: 'anonymous', role: 'anonymous' };
    }
    if (authorizationHeader === 'Bearer user-token') {
      return principals.user as GatewayPrincipal;
    }
    if (authorizationHeader === 'Bearer user-b-token') {
      return principals.userB as GatewayPrincipal;
    }
    if (authorizationHeader === 'Bearer admin-token') {
      return principals.admin as GatewayPrincipal;
    }
    const err = new Error('Invalid or expired session') as Error & { code: string; status: number };
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    throw err;
  },
  can(principal, permission) {
    if (permission === 'public:read') {
      return true;
    }
    if (permission === 'account:read' || permission === 'account:write') {
      return principal.role === 'user' || principal.role === 'admin';
    }
    return principal.role === 'admin';
  },
};

describe('handleRequest', () => {
  it('returns health without enabling live trading', () => {
    const res = handleRequest({ method: 'GET', path: '/health' }, baseConfig);
    assert.equal(res.status, 200);
    const body = res.body as { status: string; liveTradingEnabled: boolean };
    assert.equal(body.status, 'ok');
    assert.equal(body.liveTradingEnabled, false);
    assert.equal(res.headers['content-type'], 'application/json');
    assert.ok(res.headers['x-correlation-id']);
  });

  it('propagates incoming correlation id', () => {
    const res = handleRequest(
      { method: 'GET', path: '/health', headers: { 'X-Correlation-Id': 'abc-123' } },
      baseConfig,
    );
    assert.equal(res.headers['x-correlation-id'], 'abc-123');
  });

  it('exposes readiness and execution policy without order routes', () => {
    const ready = handleRequest({ method: 'GET', path: '/ready' }, baseConfig);
    assert.equal(ready.status, 200);
    const readyBody = ready.body as { tradingMode: string; killSwitchActive: boolean };
    assert.equal(readyBody.tradingMode, 'paper');
    assert.equal(readyBody.killSwitchActive, false);

    const policy = handleRequest({ method: 'GET', path: '/v1/execution/policy' }, baseConfig);
    assert.equal(policy.status, 200);
    const policyBody = policy.body as { paperIsolatedFromLive: boolean; liveTradingEnabled: boolean };
    assert.equal(policyBody.paperIsolatedFromLive, true);
    assert.equal(policyBody.liveTradingEnabled, false);
  });

  it('returns 404 for unknown and trading-execution routes (not implemented)', () => {
    const missing = handleRequest({ method: 'GET', path: '/nope' }, baseConfig);
    assert.equal(missing.status, 404);
    const body = missing.body as { error: { code: string } };
    assert.equal(body.error.code, 'NOT_FOUND');

    const order = handleRequest({ method: 'POST', path: '/v1/orders' }, baseConfig);
    assert.equal(order.status, 404);
  });

  it('requires auth for /v1/me even when no auth port is configured', () => {
    const res = handleRequest({ method: 'GET', path: '/v1/me' }, baseConfig);
    assert.equal(res.status, 401);
    const body = res.body as { error: { code: string } };
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('returns the authenticated principal on /v1/me', () => {
    const res = handleRequest(
      { method: 'GET', path: '/v1/me', headers: { authorization: 'Bearer user-token' } },
      baseConfig,
      auth,
    );
    assert.equal(res.status, 200);
    const body = res.body as { id: string; role: string };
    assert.equal(body.id, 'user-1');
    assert.equal(body.role, 'user');
  });

  it('rejects a bad token on protected routes', () => {
    const res = handleRequest(
      { method: 'GET', path: '/v1/me', headers: { authorization: 'Bearer bad' } },
      baseConfig,
      auth,
    );
    assert.equal(res.status, 401);
    const body = res.body as { error: { code: string } };
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('forbids users from admin routes and allows admins', () => {
    const userRes = handleRequest(
      { method: 'GET', path: '/v1/admin/status', headers: { authorization: 'Bearer user-token' } },
      baseConfig,
      auth,
    );
    assert.equal(userRes.status, 403);
    const userBody = userRes.body as { error: { code: string } };
    assert.equal(userBody.error.code, 'FORBIDDEN');

    const adminRes = handleRequest(
      { method: 'GET', path: '/v1/admin/status', headers: { authorization: 'Bearer admin-token' } },
      baseConfig,
      auth,
    );
    assert.equal(adminRes.status, 200);
    const adminBody = adminRes.body as { role: string; liveTradingEnabled: boolean };
    assert.equal(adminBody.role, 'admin');
    assert.equal(adminBody.liveTradingEnabled, false);
  });

  it('rejects anonymous profile and settings access', () => {
    const profile = handleRequest({ method: 'GET', path: '/v1/profile' }, baseConfig, auth);
    assert.equal(profile.status, 401);
    const settings = handleRequest({ method: 'PATCH', path: '/v1/settings', body: { theme: 'dark' } }, baseConfig, auth);
    assert.equal(settings.status, 401);
  });

  it('scopes profile and settings to the authenticated principal', () => {
    const directory: Record<string, { name: string; theme: string }> = {};
    const users = {
      getProfile(userId: string) {
        return { userId, displayName: directory[userId]?.name ?? userId };
      },
      updateProfile(userId: string, patch: unknown) {
        const body = patch as { displayName?: string; userId?: string };
        directory[userId] = { name: body.displayName ?? userId, theme: directory[userId]?.theme ?? 'system' };
        return { userId, displayName: directory[userId].name, ignoredClientUserId: body.userId };
      },
      getSettings(userId: string) {
        return { userId, theme: directory[userId]?.theme ?? 'system', liveTradingEnabledByPreference: false };
      },
      updateSettings(userId: string, patch: unknown) {
        const body = patch as { theme?: string };
        directory[userId] = { name: directory[userId]?.name ?? userId, theme: body.theme ?? 'system' };
        return { userId, theme: directory[userId].theme, liveTradingEnabledByPreference: false };
      },
    };

    const aPatch = handleRequest(
      {
        method: 'PATCH',
        path: '/v1/profile',
        headers: { authorization: 'Bearer user-token' },
        body: { displayName: 'Ada', userId: 'user-2' },
      },
      baseConfig,
      auth,
      users,
    );
    assert.equal(aPatch.status, 200);
    const aBody = aPatch.body as { userId: string; displayName: string };
    assert.equal(aBody.userId, 'user-1');
    assert.equal(aBody.displayName, 'Ada');

    const bGet = handleRequest(
      { method: 'GET', path: '/v1/profile', headers: { authorization: 'Bearer user-b-token' } },
      baseConfig,
      auth,
      users,
    );
    assert.equal(bGet.status, 200);
    const bBody = bGet.body as { userId: string; displayName: string };
    assert.equal(bBody.userId, 'user-2');
    assert.equal(bBody.displayName, 'user-2');
  });

  it('returns the current user entitlements and rejects subscription writes', () => {
    const entitlements = {
      getEntitlements(userId: string) {
        return {
          userId,
          plan: userId === 'user-1' ? 'FREE' : 'PRO',
          entitlements: userId === 'user-1' ? ['PAPER_TRADING'] : ['PAPER_TRADING', 'BACKTESTING'],
          liveTradingGrantedBySubscription: false,
        };
      },
    };

    const anon = handleRequest({ method: 'GET', path: '/v1/entitlements' }, baseConfig, auth, undefined, entitlements);
    assert.equal(anon.status, 401);

    const self = handleRequest(
      { method: 'GET', path: '/v1/entitlements', headers: { authorization: 'Bearer user-token' } },
      baseConfig,
      auth,
      undefined,
      entitlements,
    );
    assert.equal(self.status, 200);
    const selfBody = self.body as { userId: string; plan: string; liveTradingGrantedBySubscription: boolean };
    assert.equal(selfBody.userId, 'user-1');
    assert.equal(selfBody.plan, 'FREE');
    assert.equal(selfBody.liveTradingGrantedBySubscription, false);

    const other = handleRequest(
      { method: 'GET', path: '/v1/entitlements', headers: { authorization: 'Bearer user-b-token' } },
      baseConfig,
      auth,
      undefined,
      entitlements,
    );
    const otherBody = other.body as { userId: string; plan: string };
    assert.equal(otherBody.userId, 'user-2');
    assert.equal(otherBody.plan, 'PRO');

    const write = handleRequest(
      {
        method: 'PATCH',
        path: '/v1/entitlements',
        headers: { authorization: 'Bearer user-token' },
        body: { plan: 'ADVANCED', entitlements: ['LIVE_TRADING'] },
      },
      baseConfig,
      auth,
      undefined,
      entitlements,
    );
    assert.equal(write.status, 405);
    const writeBody = write.body as { error: { code: string } };
    assert.equal(writeBody.error.code, 'NOT_WRITABLE');
  });

  it('records request telemetry without changing health behavior', () => {
    const calls: Array<{ path: string; status: number; correlationId: string }> = [];
    const telemetry = {
      recordRequest(input: { path: string; status: number; correlationId: string }) {
        calls.push(input);
      },
    };
    const res = handleRequest(
      { method: 'GET', path: '/health', headers: { 'x-correlation-id': 'obs-1' } },
      baseConfig,
      undefined,
      undefined,
      undefined,
      telemetry,
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-correlation-id'], 'obs-1');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.path, '/health');
    assert.equal(calls[0]?.status, 200);
  });

  it('exposes metrics only to admins', () => {
    const userRes = handleRequest(
      { method: 'GET', path: '/v1/admin/metrics', headers: { authorization: 'Bearer user-token' } },
      baseConfig,
      auth,
    );
    assert.equal(userRes.status, 403);
    const adminRes = handleRequest(
      { method: 'GET', path: '/v1/admin/metrics', headers: { authorization: 'Bearer admin-token' } },
      baseConfig,
      auth,
    );
    assert.equal(adminRes.status, 200);
    const body = adminRes.body as { liveTradingEnabled: boolean; metrics: { counters: unknown[] } };
    assert.equal(body.liveTradingEnabled, false);
    assert.ok(Array.isArray(body.metrics.counters));
  });

  it('falls back to x-request-id and rejects unsafe correlation ids', () => {
    const fromRequestId = handleRequest(
      { method: 'GET', path: '/health', headers: { 'x-request-id': 'req-77' } },
      baseConfig,
    );
    assert.equal(fromRequestId.headers['x-correlation-id'], 'req-77');
    const unsafe = handleRequest(
      { method: 'GET', path: '/health', headers: { 'x-correlation-id': 'bad\nid' } },
      baseConfig,
    );
    assert.notEqual(unsafe.headers['x-correlation-id'], 'bad\nid');
    assert.ok(unsafe.headers['x-correlation-id']);
  });
});


