import test from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentId } from '@ai-trading-platform/domain';
import { RealtimeMarketDataPipeline, type RealtimeMarketDataProvider } from './realtime.js';
import type { Quote } from './types.js';

const btc = InstrumentId.create('BTC-USD');
const eth = InstrumentId.create('ETH-USD');

function quote(instrumentId: InstrumentId, last = 100): Quote {
  return { instrumentId, timestamp: new Date('2026-01-01T00:00:00Z'), bid: last - 1, ask: last + 1, last };
}

test('realtime pipeline validates and forwards subscribed instruments', async () => {
  let emit: ((event: { type: 'quote'; data: Quote }) => void) | undefined;
  const provider: RealtimeMarketDataProvider = {
    name: 'mock-stream', realtime: true,
    async subscribe(_request, onEvent) {
      emit = onEvent;
      return { id: 'sub-1', close() {} };
    },
  };
  const received: Quote[] = [];
  const pipeline = new RealtimeMarketDataPipeline(provider, { onEvent: (event) => received.push(event.data as Quote) });
  const subscription = await pipeline.subscribe({ instrumentIds: [btc] });
  emit!({ type: 'quote', data: quote(btc, 101) });
  emit!({ type: 'quote', data: quote(eth, 202) });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(subscription.id, 'sub-1');
  assert.equal(received.length, 1);
  assert.equal(received[0].last, 101);
  await pipeline.closeAll();
});

test('realtime pipeline rejects non-realtime providers', () => {
  const provider: RealtimeMarketDataProvider = {
    name: 'history-only', realtime: false,
    async subscribe() { return { id: 'unused', close() {} }; },
  };
  assert.throws(() => new RealtimeMarketDataPipeline(provider), /does not support realtime/);
});

test('realtime pipeline reports malformed events and enforces buffer bound', async () => {
  let emit: ((event: { type: 'quote'; data: Quote }) => void) | undefined;
  const errors: unknown[] = [];
  const provider: RealtimeMarketDataProvider = {
    name: 'mock-errors', realtime: true,
    async subscribe(_request, onEvent) { emit = onEvent; return { id: 'sub-2', close() {} }; },
  };
  const pipeline = new RealtimeMarketDataPipeline(provider, { maxBufferedEvents: 1, onEvent: async () => {}, onError: (error) => errors.push(error) });
  await pipeline.subscribe({ instrumentIds: [btc] });
  emit!({ type: 'quote', data: quote(btc) });
  emit!({ type: 'quote', data: { ...quote(btc), bid: 200, ask: 100 } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(errors.length >= 1);
});
