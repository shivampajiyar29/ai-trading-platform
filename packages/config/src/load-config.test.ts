import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './load-config.js';

describe('loadConfig', () => {
  it('defaults to development paper trading with live flags off', () => {
    const config = loadConfig({});
    assert.equal(config.nodeEnv, 'development');
    assert.equal(config.tradingMode, 'paper');
    assert.equal(config.liveTradingEnabled, false);
    assert.equal(config.automatedLiveTradingEnabled, false);
    assert.equal(config.killSwitchActive, false);
    assert.equal(config.serviceName, 'api-gateway');
    assert.equal(config.version, '0.1.0');
  });

  it('does not enable live trading from an empty flag value', () => {
    const empty = loadConfig({ LIVE_TRADING_ENABLED: '' });
    assert.equal(empty.liveTradingEnabled, false);
  });

  it('enables live trading only for explicit true/1', () => {
    assert.equal(loadConfig({ LIVE_TRADING_ENABLED: 'true' }).liveTradingEnabled, true);
    assert.equal(loadConfig({ LIVE_TRADING_ENABLED: '1' }).liveTradingEnabled, true);
    assert.equal(loadConfig({ LIVE_TRADING_ENABLED: 'false' }).liveTradingEnabled, false);
    assert.equal(loadConfig({ LIVE_TRADING_ENABLED: '0' }).liveTradingEnabled, false);
  });

  it('rejects invalid boolean flags', () => {
    assert.throws(() => loadConfig({ LIVE_TRADING_ENABLED: 'yes' }), /Invalid boolean flag/);
  });

  it('rejects invalid trading mode', () => {
    assert.throws(() => loadConfig({ TRADING_MODE: 'shadow' }), /Invalid TRADING_MODE/);
  });

  it('rejects invalid NODE_ENV', () => {
    assert.throws(() => loadConfig({ NODE_ENV: 'staging' }), /Invalid NODE_ENV/);
  });

  it('parses kill switch and automated live flags independently', () => {
    const config = loadConfig({
      TRADING_MODE: 'live',
      LIVE_TRADING_ENABLED: 'true',
      AUTOMATED_LIVE_TRADING_ENABLED: 'true',
      TRADING_KILL_SWITCH: 'true',
    });
    assert.equal(config.tradingMode, 'live');
    assert.equal(config.liveTradingEnabled, true);
    assert.equal(config.automatedLiveTradingEnabled, true);
    assert.equal(config.killSwitchActive, true);
  });
});
