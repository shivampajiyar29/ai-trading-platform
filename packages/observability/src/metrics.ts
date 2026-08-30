export const HTTP_REQUESTS = 'http.requests';
export const HTTP_REQUEST_DURATION_MS = 'http.request_duration_ms';
export const HTTP_ERRORS = 'http.errors';

/** Reserved trading telemetry names. Nothing increments these unless a future task records them. */
export const TRADING_METRIC_NAMES = {
  signalLatencyMs: 'trading.signal_latency_ms',
  riskCheckLatencyMs: 'trading.risk_check_latency_ms',
  brokerLatencyMs: 'trading.broker_latency_ms',
  orderAckLatencyMs: 'trading.order_ack_latency_ms',
  rejectedOrders: 'trading.rejected_orders',
  duplicateOrderPrevented: 'trading.duplicate_order_prevented',
  reconciliationFailures: 'trading.reconciliation_failures',
} as const;

export type MetricLabels = Record<string, string>;

export type CounterSnapshot = {
  name: string;
  labels: MetricLabels;
  value: number;
};

export type HistogramSnapshot = {
  name: string;
  labels: MetricLabels;
  count: number;
  sum: number;
  min: number;
  max: number;
};

export type MetricsSnapshot = {
  counters: CounterSnapshot[];
  histograms: HistogramSnapshot[];
};

function labelKey(labels: MetricLabels): string {
  return Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join(',');
}

export class InMemoryMetrics {
  private readonly counters = new Map<string, { name: string; labels: MetricLabels; value: number }>();
  private readonly histograms = new Map<
    string,
    { name: string; labels: MetricLabels; count: number; sum: number; min: number; max: number }
  >();

  counter(name: string, labels: MetricLabels = {}, amount = 1): void {
    this.increment(name, labels, amount);
  }

  gauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = `${name}|${labelKey(labels)}`;
    this.counters.set(key, { name, labels: { ...labels }, value });
  }

  histogram(name: string, value: number, labels: MetricLabels = {}): void {
    this.observe(name, value, labels);
  }

  increment(name: string, labels: MetricLabels = {}, amount = 1): void {
    const key = `${name}|${labelKey(labels)}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += amount;
      return;
    }
    this.counters.set(key, { name, labels: { ...labels }, value: amount });
  }

  observe(name: string, value: number, labels: MetricLabels = {}): void {
    const key = `${name}|${labelKey(labels)}`;
    const existing = this.histograms.get(key);
    if (existing) {
      existing.count += 1;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
      return;
    }
    this.histograms.set(key, {
      name,
      labels: { ...labels },
      count: 1,
      sum: value,
      min: value,
      max: value,
    });
  }

  snapshot(): MetricsSnapshot {
    return {
      counters: [...this.counters.values()].map((row) => ({ ...row, labels: { ...row.labels } })),
      histograms: [...this.histograms.values()].map((row) => ({ ...row, labels: { ...row.labels } })),
    };
  }

  counterValue(name: string, labels: MetricLabels = {}): number {
    return this.counters.get(`${name}|${labelKey(labels)}`)?.value ?? 0;
  }
}
