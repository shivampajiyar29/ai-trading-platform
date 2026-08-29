import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTradingMode, parseTradingMode } from './trading-mode.js';

describe('TradingMode', () => {
  it('accepts paper and live', () => {
    assert.equal(isTradingMode('paper'), true);
    assert.equal(isTradingMode('live'), true);
  });

  it('rejects unknown modes', () => {
    assert.equal(isTradingMode('demo'), false);
    assert.equal(isTradingMode(''), false);
  });

  it('parses case-insensitively', () => {
    assert.equal(parseTradingMode('PAPER'), 'paper');
    assert.equal(parseTradingMode(' Live '), 'live');
  });

  it('throws on invalid mode', () => {
    assert.throws(() => parseTradingMode('shadow'), /Invalid trading mode/);
  });
});
