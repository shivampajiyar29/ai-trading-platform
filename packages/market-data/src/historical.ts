import {
  type Candle,
  type MarketDataInterval,
  type MarketDataProvider,
  type MarketDataRange,
} from './types.js';
import { validateCandle, validateInterval, validateRange } from './validation.js';

const INTERVAL_MS: Record<MarketDataInterval, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

export interface HistoricalDataRequest {
  readonly instrumentId: import('@ai-trading-platform/domain').InstrumentId;
  readonly interval: MarketDataInterval;
  readonly range: MarketDataRange;
}

export interface HistoricalDataPipelineOptions {
  readonly maxCandlesPerRequest?: number;
  readonly sink?: (candles: readonly Candle[]) => Promise<void> | void;
}

export interface HistoricalDataResult {
  readonly candles: readonly Candle[];
  readonly requested: MarketDataRange;
  readonly chunks: number;
}

/** Provider-independent historical ingestion: chunk, validate, normalize, deduplicate and sort. */
export class HistoricalDataPipeline {
  private readonly maxCandlesPerRequest: number;
  private readonly sink: ((candles: readonly Candle[]) => Promise<void> | void) | undefined;

  constructor(private readonly provider: MarketDataProvider, options: HistoricalDataPipelineOptions = {}) {
    this.maxCandlesPerRequest = options.maxCandlesPerRequest ?? 5_000;
    if (!Number.isInteger(this.maxCandlesPerRequest) || this.maxCandlesPerRequest <= 0) {
      throw new Error('maxCandlesPerRequest must be a positive integer');
    }
    this.sink = options.sink;
  }

  async load(request: HistoricalDataRequest): Promise<HistoricalDataResult> {
    validateInterval(request.interval);
    validateRange(request.range);
    if (!this.provider.capabilities.historical || !this.provider.capabilities.candles) {
      throw new Error(`Provider does not support historical candles: ${this.provider.name}`);
    }
    if (!this.provider.capabilities.intervals.includes(request.interval)) {
      throw new Error(`Provider does not support interval ${request.interval}: ${this.provider.name}`);
    }

    const chunks = splitRange(request.range, request.interval, this.maxCandlesPerRequest);
    const all: Candle[] = [];
    for (const range of chunks) {
      const candles = await this.provider.getCandles(request.instrumentId, request.interval, range);
      for (const candle of candles) {
        validateCandle(candle);
        if (!candle.instrumentId.equals(request.instrumentId)) {
          throw new Error('Historical candle instrument does not match request');
        }
        all.push(candle);
      }
    }

    const normalized = deduplicateAndSort(all);
    if (this.sink) await this.sink(normalized);
    return { candles: normalized, requested: request.range, chunks: chunks.length };
  }
}

function splitRange(range: MarketDataRange, interval: MarketDataInterval, maxCandles: number): MarketDataRange[] {
  const chunkMs = INTERVAL_MS[interval] * maxCandles;
  const from = range.from.getTime();
  const to = range.to.getTime();
  const result: MarketDataRange[] = [];
  for (let cursor = from; cursor < to; cursor += chunkMs) {
    result.push({ from: new Date(cursor), to: new Date(Math.min(cursor + chunkMs, to)) });
  }
  return result;
}

function deduplicateAndSort(candles: readonly Candle[]): Candle[] {
  const byTimestamp = new Map<string, Candle>();
  for (const candle of candles) {
    const key = `${candle.instrumentId.toString()}|${candle.timestamp.getTime()}`;
    if (!byTimestamp.has(key)) byTimestamp.set(key, candle);
  }
  return [...byTimestamp.values()].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
