import { InstrumentId } from '@ai-trading-platform/domain';
import { MarketDataProvider } from './types.js';

export class MarketDataProviderRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();

  register(provider: MarketDataProvider): void {
    const name = provider.name.trim();
    if (!name) throw new Error('Market data provider name cannot be empty');
    if (this.providers.has(name)) throw new Error(`Market data provider already registered: ${name}`);
    this.providers.set(name, provider);
  }

  get(name: string): MarketDataProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Market data provider not registered: ${name}`);
    return provider;
  }

  list(): readonly MarketDataProvider[] {
    return [...this.providers.values()];
  }

  async getQuote(providerName: string, instrumentId: InstrumentId) {
    return this.get(providerName).getQuote(instrumentId);
  }
}
