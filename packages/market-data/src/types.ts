import { InstrumentId } from '@ai-trading-platform/domain';

export type MarketDataInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | '1d';

export interface MarketDataRange {
  readonly from: Date;
  readonly to: Date;
}

export interface Quote {
  readonly instrumentId: InstrumentId;
  readonly timestamp: Date;
  readonly bid?: number;
  readonly ask?: number;
  readonly last?: number;
  readonly volume?: number;
}

export interface Candle {
  readonly instrumentId: InstrumentId;
  readonly timestamp: Date;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface InstrumentMetadata {
  readonly instrumentId: InstrumentId;
  readonly symbol: string;
  readonly exchange?: string;
  readonly currency?: string;
  readonly assetClass?: string;
  readonly timezone?: string;
}

export interface MarketDataCapabilities {
  readonly quotes: boolean;
  readonly candles: boolean;
  readonly instrumentLookup: boolean;
  readonly intervals: readonly MarketDataInterval[];
  readonly realtime: boolean;
  readonly historical: boolean;
}

export interface MarketDataProvider {
  readonly name: string;
  readonly capabilities: MarketDataCapabilities;
  getQuote(instrumentId: InstrumentId): Promise<Quote>;
  getCandles(
    instrumentId: InstrumentId,
    interval: MarketDataInterval,
    range: MarketDataRange,
  ): Promise<readonly Candle[]>;
  getInstrument(instrumentId: InstrumentId): Promise<InstrumentMetadata>;
}

export class MarketDataProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_REQUEST'
      | 'NOT_SUPPORTED'
      | 'NOT_FOUND'
      | 'UPSTREAM_ERROR'
      | 'UNAVAILABLE',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'MarketDataProviderError';
  }
}
