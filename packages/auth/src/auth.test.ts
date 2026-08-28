import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, parseBearerToken } from './authenticate.js';
import { authorize, can } from './authorize.js';
import { InMemoryCredentialStore, verifyCredentials } from './credentials.js';
import { AuthError } from './errors.js';
import { ANONYMOUS_PRINCIPAL, principalFor } from './principal.js';
import { InMemorySessionStore } from './sessions.js';

describe('RBAC', () => {
  it('gives anonymous only public:read', () => {
    assert.equal(can(ANONYMOUS_PRINCIPAL, 'public:read'), true);
    assert.equal(can(ANONYMOUS_PRINCIPAL, 'account:read'), false);
    assert.equal(can(ANONYMOUS_PRINCIPAL, 'admin:read'), false);
  });

  it('gives user account:read but not admin:read', () => {
    const user = principalFor('user-1', 'user');
    assert.equal(can(user, 'account:read'), true);
    assert.equal(can(user, 'account:write'), true);
    assert.equal(can(user, 'admin:read'), false);
    assert.throws(
      () => authorize(user, 'admin:read'),
      (err: unknown) => err instanceof AuthError && err.code === 'FORBIDDEN' && err.status === 403,
    );
  });

  it('gives admin all defined permissions', () => {
    const admin = principalFor('admin-1', 'admin');
    assert.equal(can(admin, 'public:read'), true);
    assert.equal(can(admin, 'account:read'), true);
    assert.equal(can(admin, 'account:write'), true);
    assert.equal(can(admin, 'admin:read'), true);
    authorize(admin, 'admin:read');
  });
});

describe('credentials', () => {
  it('rejects short passwords', () => {
    const store = new InMemoryCredentialStore();
    assert.throws(() => store.register('alice', 'short', 'user'), /at least 8/);
  });

  it('verifies registered credentials and rejects wrong passwords', () => {
    const store = new InMemoryCredentialStore();
    store.register('Alice', 'correct-horse', 'user', 'user-alice');
    const principal = verifyCredentials(store, 'alice', 'correct-horse');
    assert.equal(principal.id, 'user-alice');
    assert.equal(principal.role, 'user');
    assert.throws(
      () => verifyCredentials(store, 'alice', 'wrong-password'),
      (err: unknown) => err instanceof AuthError && err.code === 'INVALID_CREDENTIALS',
    );
    assert.throws(() => verifyCredentials(store, 'missing', 'correct-horse'), /Invalid username/);
  });
});

describe('sessions and bearer auth', () => {
  it('treats missing Authorization as anonymous', () => {
    const sessions = new InMemorySessionStore();
    assert.equal(authenticate(undefined, sessions).role, 'anonymous');
    assert.equal(authenticate('', sessions).role, 'anonymous');
  });

  it('rejects non-Bearer schemes', () => {
    const sessions = new InMemorySessionStore();
    assert.throws(
      () => parseBearerToken('Basic abc'),
      (err: unknown) => err instanceof AuthError && err.code === 'UNAUTHORIZED',
    );
    assert.throws(() => authenticate('Basic abc', sessions), /Bearer/);
  });

  it('resolves a valid session token and rejects a bad one', () => {
    const sessions = new InMemorySessionStore();
    const issued = sessions.issue(principalFor('user-1', 'user'));
    const principal = authenticate(`Bearer ${issued.token}`, sessions);
    assert.equal(principal.id, 'user-1');
    assert.equal(principal.role, 'user');
    assert.throws(
      () => authenticate('Bearer sess_deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', sessions),
      (err: unknown) => err instanceof AuthError && err.code === 'UNAUTHORIZED',
    );
  });

  it('expires and revokes sessions', () => {
    const sessions = new InMemorySessionStore();
    const expired = sessions.issue(principalFor('user-1', 'user'), -1);
    assert.equal(sessions.find(expired.token), undefined);
    const live = sessions.issue(principalFor('user-2', 'admin'));
    sessions.revoke(live.token);
    assert.equal(sessions.find(live.token), undefined);
  });
});
