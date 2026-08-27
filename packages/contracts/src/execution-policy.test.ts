import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, ErrorCodes } from './app-error.js';
import { assertExecutionAllowed, resolveExecutionPath } from './execution-policy.js';
import { DEFAULT_FEATURE_FLAGS } from './feature-flags.js';

describe('resolveExecutionPath', () => {
  it('routes paper to paper even if live flags are on', () => {
    const path = resolveExecutionPath({
      requestedMode: 'paper',
      flags: { liveTradingEnabled: true, automatedLiveTradingEnabled: true },
      killSwitchActive: false,
    });
    assert.equal(path, 'paper');
  });

  it('blocks live when flags use the safe default', () => {
    const path = resolveExecutionPath({
      requestedMode: 'live',
      flags: DEFAULT_FEATURE_FLAGS,
      killSwitchActive: false,
    });
    assert.equal(path, 'blocked');
  });

  it('allows live only when requested, enabled, and kill switch is off', () => {
    const path = resolveExecutionPath({
      requestedMode: 'live',
      flags: { liveTradingEnabled: true, automatedLiveTradingEnabled: false },
      killSwitchActive: false,
    });
    assert.equal(path, 'live');
  });

  it('blocks live when kill switch is active even if live is enabled', () => {
    const path = resolveExecutionPath({
      requestedMode: 'live',
      flags: { liveTradingEnabled: true, automatedLiveTradingEnabled: true },
      killSwitchActive: true,
    });
    assert.equal(path, 'blocked');
  });

  it('does not apply kill switch to paper path', () => {
    const path = resolveExecutionPath({
      requestedMode: 'paper',
      flags: DEFAULT_FEATURE_FLAGS,
      killSwitchActive: true,
    });
    assert.equal(path, 'paper');
  });
});

describe('assertExecutionAllowed', () => {
  it('returns paper for paper requests', () => {
    const path = assertExecutionAllowed({
      requestedMode: 'paper',
      flags: DEFAULT_FEATURE_FLAGS,
      killSwitchActive: false,
    });
    assert.equal(path, 'paper');
  });

  it('throws LIVE_TRADING_DISABLED when live is requested but flagged off', () => {
    assert.throws(
      () =>
        assertExecutionAllowed({
          requestedMode: 'live',
          flags: DEFAULT_FEATURE_FLAGS,
          killSwitchActive: false,
        }),
      (err: unknown) =>
        err instanceof AppError &&
        err.code === ErrorCodes.LIVE_TRADING_DISABLED &&
        err.status === 403,
    );
  });

  it('throws KILL_SWITCH_ACTIVE when live is requested under kill switch', () => {
    assert.throws(
      () =>
        assertExecutionAllowed({
          requestedMode: 'live',
          flags: { liveTradingEnabled: true, automatedLiveTradingEnabled: false },
          killSwitchActive: true,
        }),
      (err: unknown) =>
        err instanceof AppError && err.code === ErrorCodes.KILL_SWITCH_ACTIVE,
    );
  });
});
