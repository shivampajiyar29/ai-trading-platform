import test from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentId } from '@ai-trading-platform/domain';
import { HistoricalDataPipeline, type HistoricalDataRequest } from './historical.js';
import type { Candle, MarketDataProvider } from './types.js';

const instrumentId = InstrumentId.create('BTC-USD');
const request: HistoricalDataRequest = {
  instrumentId,
  interval: '1m',
  range: { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-01T00:03:00Z') },
};

function candle(timestamp: string, close: number): Candle {
  return { instrumentId, timestamp: new Date(timestamp), open: close - 1, high: close + 1, low: close - 2, close, volume: 10 };
}

test('historical pipeline validates, orders and deduplicates provider candles', async () => {
  const provider: MarketDataProvider = {
    name: 'mock-history',
    capabilities: { quotes: false, candles: true, instrumentLookup: false, intervals: ['1m'], realtime: false, historical: true },
    async getQuote() { throw new Error('unused'); },
    async getInstrument() { throw new Error('unused'); },
    async getCandles() {
      return [candle('2026-01-01T00:02:00Z', 102), candle('2026-01-01T00:01:00Z', 101), candle('2026-01-01T00:02:00Z', 999)];
    },
  };
  const pipeline = new HistoricalDataPipeline(provider);
  const result = await pipeline.load(request);
  assert.equal(result.chunks, 1);
  assert.deepEqual(result.candles.map((x) => x.timestamp.toISOString()), [
    '2026-01-01T00:01:00.000Z',
    '2026-01-01T00:02:00.000Z',
  ]);
  assert.equal(result.candles[1].close, 102);
});

test('historical pipeline rejects providers without historical support', async () => {
  const provider: MarketDataProvider = {
    name: 'realtime-only',
    capabilities: { quotes: true, candles: true, instrumentLookup: false, intervals: ['1m'], realtime: true, historical: false },
    async getQuote() { throw new Error('unused'); },
    async getCandles() { return []; },
    async getInstrument() { throw new Error('unused'); },
  };
  await assert.rejects(() => new HistoricalDataPipeline(provider).load(request), /does not support historical/);
});

test('historical pipeline rejects malformed provider candles', async () => {
  const provider: MarketDataProvider = {
    name: 'bad-history',
    capabilities: { quotes: false, candles: true, instrumentLookup: false, intervals: ['1m'], realtime: false, historical: true },
    async getQuote() { throw new Error('unused'); },
    async getInstrument() { throw new Error('unused'); },
    async getCandles() { return [{ ...candle('2026-01-01T00:01:00Z', 101), high: 50 }]; },
  };
  await assert.rejects(() => new HistoricalDataPipeline(provider).load(request), /Candle high\/low/);
});
