import { type InstrumentId } from '@ai-trading-platform/domain';
import { validateCandle, validateQuote } from './validation.js';
import { type Candle, type MarketDataInterval, type Quote } from './types.js';

export type MarketDataEvent =
  | { readonly type: 'quote'; readonly data: Quote }
  | { readonly type: 'candle'; readonly data: Candle };

export interface RealtimeSubscriptionRequest {
  readonly instrumentIds: readonly InstrumentId[];
  readonly intervals?: readonly MarketDataInterval[];
}

export interface RealtimeSubscription {
  readonly id: string;
  readonly close: () => Promise<void> | void;
}

export interface RealtimeMarketDataProvider {
  readonly name: string;
  readonly realtime: boolean;
  subscribe(
    request: RealtimeSubscriptionRequest,
    onEvent: (event: MarketDataEvent) => void,
    onError: (error: unknown) => void,
  ): Promise<RealtimeSubscription>;
}

export interface RealtimeMarketDataPipelineOptions {
  /** Maximum events retained while the consumer is processing synchronously. */
  readonly maxBufferedEvents?: number;
  readonly onEvent?: (event: MarketDataEvent) => Promise<void> | void;
  readonly onError?: (error: unknown) => void;
}

/**
 * Provider-neutral realtime market-data boundary.
 *
 * Providers own WebSocket/SSE/vendor details. The pipeline owns subscription
 * lifecycle, event validation, instrument filtering and a bounded in-memory
 * buffer so an unhealthy consumer cannot grow memory without limit.
 */
export class RealtimeMarketDataPipeline {
  private readonly maxBufferedEvents: number;
  private readonly onEvent?: (event: MarketDataEvent) => Promise<void> | void;
  private readonly onError?: (error: unknown) => void;
  private readonly subscriptions = new Map<string, RealtimeSubscription>();
  private readonly allowedInstruments = new Set<string>();
  private processing = false;
  private readonly buffer: MarketDataEvent[] = [];

  constructor(private readonly provider: RealtimeMarketDataProvider, options: RealtimeMarketDataPipelineOptions = {}) {
    if (!provider.realtime) throw new Error(`Provider does not support realtime market data: ${provider.name}`);
    this.maxBufferedEvents = options.maxBufferedEvents ?? 1_000;
    if (!Number.isInteger(this.maxBufferedEvents) || this.maxBufferedEvents <= 0) {
      throw new Error('maxBufferedEvents must be a positive integer');
    }
    this.onEvent = options.onEvent;
    this.onError = options.onError;
  }

  async subscribe(request: RealtimeSubscriptionRequest): Promise<RealtimeSubscription> {
    if (request.instrumentIds.length === 0) throw new Error('At least one instrument is required');
    this.allowedInstruments.clear();
    for (const instrumentId of request.instrumentIds) this.allowedInstruments.add(instrumentId.toString());

    const upstream = await this.provider.subscribe(
      request,
      (event) => this.accept(event),
      (error) => this.onError?.(error),
    );
    const subscription: RealtimeSubscription = {
      id: upstream.id,
      close: async () => {
        this.subscriptions.delete(upstream.id);
        await upstream.close();
      },
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async closeAll(): Promise<void> {
    const active = [...this.subscriptions.values()];
    this.subscriptions.clear();
    for (const subscription of active) await subscription.close();
    this.buffer.length = 0;
  }

  get bufferedEventCount(): number {
    return this.buffer.length;
  }

  private accept(event: MarketDataEvent): void {
    try {
      const instrumentId = event.data.instrumentId;
      if (!this.allowedInstruments.has(instrumentId.toString())) return;
      if (event.type === 'quote') validateQuote(event.data);
      else validateCandle(event.data);

      if (this.buffer.length >= this.maxBufferedEvents) {
        this.buffer.shift();
        this.onError?.(new Error('Realtime market-data buffer overflow; oldest event dropped'));
      }
      this.buffer.push(event);
      void this.drain();
    } catch (error) {
      this.onError?.(error);
    }
  }

  private async drain(): Promise<void> {
    if (this.processing || !this.onEvent) return;
    this.processing = true;
    try {
      while (this.buffer.length > 0) {
        const event = this.buffer.shift()!;
        await this.onEvent(event);
      }
    } finally {
      this.processing = false;
    }
  }
}
