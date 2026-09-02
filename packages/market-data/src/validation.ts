import { Candle, MarketDataInterval, MarketDataRange, Quote } from './types.js';

const INTERVALS: readonly MarketDataInterval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export function validateRange(range: MarketDataRange): void {
  if (!(range.from instanceof Date) || Number.isNaN(range.from.getTime())) {
    throw new Error('Market data range.from must be a valid Date');
  }
  if (!(range.to instanceof Date) || Number.isNaN(range.to.getTime())) {
    throw new Error('Market data range.to must be a valid Date');
  }
  if (range.from.getTime() >= range.to.getTime()) {
    throw new Error('Market data range.from must be before range.to');
  }
}

export function validateInterval(interval: MarketDataInterval): void {
  if (!INTERVALS.includes(interval)) {
    throw new Error(`Unsupported market data interval: ${interval}`);
  }
}

export function validateQuote(quote: Quote): void {
  if (!(quote.timestamp instanceof Date) || Number.isNaN(quote.timestamp.getTime())) {
    throw new Error('Quote timestamp must be a valid Date');
  }
  for (const [name, value] of Object.entries({ bid: quote.bid, ask: quote.ask, last: quote.last, volume: quote.volume })) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`Quote ${name} must be a finite non-negative number`);
    }
  }
  if (quote.bid !== undefined && quote.ask !== undefined && quote.bid > quote.ask) {
    throw new Error('Quote bid cannot exceed ask');
  }
}

export function validateCandle(candle: Candle): void {
  if (!(candle.timestamp instanceof Date) || Number.isNaN(candle.timestamp.getTime())) {
    throw new Error('Candle timestamp must be a valid Date');
  }
  const values = [candle.open, candle.high, candle.low, candle.close, candle.volume];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Candle values must be finite non-negative numbers');
  }
  if (candle.high < Math.max(candle.open, candle.close) || candle.low > Math.min(candle.open, candle.close)) {
    throw new Error('Candle high/low must contain open and close');
  }
  if (candle.low > candle.high) {
    throw new Error('Candle low cannot exceed high');
  }
}
