import test from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentId } from '@ai-trading-platform/domain';
import { normalizeCandle, normalizeCandles, normalizeQuote, validateQuote } from './index.js';

const id = InstrumentId.create('TEST');

test('quote normalization preserves values and clones timestamp', () => {
  const timestamp = new Date('2026-01-01T00:00:00Z');
  const normalized = normalizeQuote({ instrumentId: id, timestamp, last: 100 });
  assert.notEqual(normalized.timestamp, timestamp);
  assert.equal(normalized.timestamp.getTime(), timestamp.getTime());
  assert.equal(normalized.last, 100);
});

test('validation requires a usable quote price', () => {
  assert.throws(() => validateQuote({ instrumentId: id, timestamp: new Date(0) }), /at least one price/);
});

test('candle normalization is deterministic and deduplicates timestamps', () => {
  const first = normalizeCandle({ instrumentId: id, timestamp: new Date(2), open: 2, high: 3, low: 1, close: 2, volume: 4 });
  const duplicate = { ...first, close: 2.5, high: 3 };
  const earlier = normalizeCandle({ instrumentId: id, timestamp: new Date(1), open: 1, high: 2, low: 0, close: 1, volume: 3 });
  const result = normalizeCandles([first, duplicate, earlier]);
  assert.deepEqual(result.map((candle) => candle.timestamp.getTime()), [1, 2]);
  assert.equal(result[1].close, 2);
});
