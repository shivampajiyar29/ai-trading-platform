import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserError } from './errors.js';
import { parseProfilePatch } from './profile.js';
import { InMemoryUserDirectory } from './repository.js';
import { parseSettingsPatch } from './settings.js';
import { requireOwnedUserId, UserService } from './service.js';

describe('UserService profile', () => {
  it('creates a default profile for a new user and persists updates', () => {
    const directory = new InMemoryUserDirectory();
    let t = 0;
    const service = new UserService(directory, () => `2026-01-01T00:00:0${t++}Z`);
    const created = service.getProfile('user-a');
    assert.equal(created.userId, 'user-a');
    assert.equal(created.locale, 'en');
    assert.equal(created.preferredCurrency, 'USD');
    const updated = service.updateProfile('user-a', {
      displayName: 'Ada',
      locale: 'en-US',
      timezone: 'America/New_York',
      country: 'us',
      preferredCurrency: 'usd',
    });
    assert.equal(updated.displayName, 'Ada');
    assert.equal(updated.country, 'US');
    assert.equal(updated.preferredCurrency, 'USD');
    assert.equal(service.getProfile('user-a').displayName, 'Ada');
  });

  it('rejects invalid profile fields and mass-assignment of identity fields', () => {
    const service = new UserService(new InMemoryUserDirectory(), () => 't');
    service.getProfile('user-a');
    assert.throws(() => service.updateProfile('user-a', { displayName: '' }), /displayName/);
    assert.throws(() => service.updateProfile('user-a', { locale: 'english' }), /locale/);
    assert.throws(() => service.updateProfile('user-a', { country: 'USA' }), /country/);
    assert.throws(
      () => parseProfilePatch({ userId: 'user-b', displayName: 'X' }),
      (err: unknown) => err instanceof UserError && err.code === 'INVALID_INPUT',
    );
    assert.throws(() => parseProfilePatch(['nope']), /JSON object/);
  });
});

describe('UserService settings', () => {
  it('defaults to paper mode and does not treat preference as live enablement', () => {
    const service = new UserService(new InMemoryUserDirectory(), () => 't');
    const settings = service.getSettings('user-a');
    assert.equal(settings.defaultTradingModePreference, 'paper');
    assert.equal(settings.liveTradingEnabledByPreference, false);
    assert.equal(settings.theme, 'system');
    const updated = service.updateSettings('user-a', {
      theme: 'dark',
      defaultTradingModePreference: 'live',
      notificationsEmail: true,
    });
    assert.equal(updated.theme, 'dark');
    assert.equal(updated.defaultTradingModePreference, 'live');
    assert.equal(updated.liveTradingEnabledByPreference, false);
  });

  it('rejects dangerous or invalid settings keys', () => {
    assert.throws(() => parseSettingsPatch({ liveTradingEnabled: true }), /not writable/);
    assert.throws(() => parseSettingsPatch({ theme: 'neon' }), /theme/);
    assert.throws(() => parseSettingsPatch({ chartShowVolume: 'yes' }), /boolean/);
  });

  it('surfaces persistence failures', () => {
    const directory = new InMemoryUserDirectory();
    const service = new UserService(directory, () => 't');
    directory.failNextWrite = true;
    assert.throws(
      () => service.getProfile('user-a'),
      (err: unknown) => err instanceof UserError && err.code === 'PERSISTENCE_FAILURE' && err.status === 500,
    );
  });
});

describe('ownership', () => {
  it('binds resources to the authenticated principal, not a client userId', () => {
    assert.equal(requireOwnedUserId('user-a', undefined), 'user-a');
    assert.equal(requireOwnedUserId('user-a', 'user-a'), 'user-a');
    assert.throws(
      () => requireOwnedUserId('user-a', 'user-b'),
      (err: unknown) => err instanceof UserError && err.code === 'FORBIDDEN' && err.status === 403,
    );
    assert.throws(() => requireOwnedUserId('anonymous', undefined), /not found/);
  });
});

describe('user audit hooks', () => {
  it('logs profile and settings field names only', () => {
    const events: Array<{ type: string; details: Record<string, unknown> }> = [];
    const audit = {
      record(type: string, _actorId: string, _outcome: 'success' | 'denied' | 'failure', details: Record<string, unknown> = {}) {
        events.push({ type, details });
      },
    };
    const service = new UserService(new InMemoryUserDirectory(), () => 't', audit);
    service.updateProfile('user-a', { displayName: 'Ada' });
    service.updateSettings('user-a', { theme: 'dark' });
    assert.equal(events[0]?.type, 'PROFILE_UPDATED');
    assert.deepEqual(events[0]?.details.fields, ['displayName']);
    assert.equal(events[1]?.type, 'SETTINGS_UPDATED');
    assert.equal(JSON.stringify(events).includes('Ada'), false);
  });
});

