import test from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentId } from '@ai-trading-platform/domain';
import {
  MarketDataProviderRegistry,
  type MarketDataProvider,
  validateCandle,
  validateQuote,
  validateRange,
} from './index.js';

test('provider registry registers and resolves providers', () => {
  const provider: MarketDataProvider = {
    name: 'mock',
    capabilities: {
      quotes: true,
      candles: true,
      instrumentLookup: true,
      intervals: ['1m', '1d'],
      realtime: false,
      historical: true,
    },
    async getQuote(instrumentId) {
      return { instrumentId, timestamp: new Date('2026-01-01T00:00:00Z'), last: 100 };
    },
    async getCandles() { return []; },
    async getInstrument(instrumentId) {
      return { instrumentId, symbol: 'TEST' };
    },
  };
  const registry = new MarketDataProviderRegistry();
  registry.register(provider);
  assert.equal(registry.get('mock'), provider);
  assert.equal(registry.list().length, 1);
});

test('range and normalized quote/candle validation reject invalid data', () => {
  assert.doesNotThrow(() => validateRange({ from: new Date(0), to: new Date(1) }));
  assert.throws(() => validateRange({ from: new Date(1), to: new Date(1) }));
  assert.doesNotThrow(() => validateQuote({ instrumentId: InstrumentId.create('x'), timestamp: new Date(0), bid: 99, ask: 100 }));
  assert.throws(() => validateQuote({ instrumentId: InstrumentId.create('x'), timestamp: new Date(0), bid: 101, ask: 100 }));
  assert.doesNotThrow(() => validateCandle({ instrumentId: InstrumentId.create('x'), timestamp: new Date(0), open: 100, high: 110, low: 90, close: 105, volume: 10 }));
  assert.throws(() => validateCandle({ instrumentId: InstrumentId.create('x'), timestamp: new Date(0), open: 100, high: 99, low: 90, close: 105, volume: 10 }));
});
