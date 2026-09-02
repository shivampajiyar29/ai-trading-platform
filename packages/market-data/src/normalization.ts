import { type Candle, type Quote } from './types.js';
import { validateCandle, validateQuote } from './validation.js';

export function normalizeQuote(quote: Quote): Quote {
  validateQuote(quote);
  return {
    instrumentId: quote.instrumentId,
    timestamp: new Date(quote.timestamp.getTime()),
    ...(quote.bid === undefined ? {} : { bid: quote.bid }),
    ...(quote.ask === undefined ? {} : { ask: quote.ask }),
    ...(quote.last === undefined ? {} : { last: quote.last }),
    ...(quote.volume === undefined ? {} : { volume: quote.volume }),
  };
}

export function normalizeCandle(candle: Candle): Candle {
  validateCandle(candle);
  return {
    instrumentId: candle.instrumentId,
    timestamp: new Date(candle.timestamp.getTime()),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

/** Canonicalize candles into timestamp order and remove duplicate instrument/timestamp records. */
export function normalizeCandles(candles: readonly Candle[]): readonly Candle[] {
  const unique = new Map<string, Candle>();
  for (const candle of candles) {
    const normalized = normalizeCandle(candle);
    const key = `${normalized.instrumentId.toString()}|${normalized.timestamp.getTime()}`;
    if (!unique.has(key)) unique.set(key, normalized);
  }
  return [...unique.values()].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
