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
  });

  it('returns 404 for unknown and trading-execution routes (not implemented)', () => {
    assert.equal(handleRequest({ method: 'GET', path: '/nope' }, baseConfig).status, 404);
    assert.equal(handleRequest({ method: 'POST', path: '/v1/orders' }, baseConfig).status, 404);
  });

  it('requires auth for /v1/me even when no auth port is configured', () => {
    const res = handleRequest({ method: 'GET', path: '/v1/me' }, baseConfig);
    assert.equal(res.status, 401);
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
  });

  it('forbids users from admin routes and allows admins', () => {
    const userRes = handleRequest(
      { method: 'GET', path: '/v1/admin/status', headers: { authorization: 'Bearer user-token' } },
      baseConfig,
      auth,
    );
    assert.equal(userRes.status, 403);
    const adminRes = handleRequest(
      { method: 'GET', path: '/v1/admin/status', headers: { authorization: 'Bearer admin-token' } },
      baseConfig,
      auth,
    );
    assert.equal(adminRes.status, 200);
    const adminBody = adminRes.body as { liveTradingEnabled: boolean };
    assert.equal(adminBody.liveTradingEnabled, false);
  });

  it('rejects anonymous profile and settings access', () => {
    assert.equal(handleRequest({ method: 'GET', path: '/v1/profile' }, baseConfig, auth).status, 401);
  });

  it('returns the current user entitlements and rejects subscription writes', () => {
    const entitlements = {
      getEntitlements(userId: string) {
        return {
          userId,
          plan: userId === 'user-1' ? 'FREE' : 'PRO',
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
    const write = handleRequest(
      {
        method: 'PATCH',
        path: '/v1/entitlements',
        headers: { authorization: 'Bearer user-token' },
        body: { plan: 'ADVANCED' },
      },
      baseConfig,
      auth,
      undefined,
      entitlements,
    );
    assert.equal(write.status, 405);
  });
});
