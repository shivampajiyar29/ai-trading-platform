export type HealthStatus = 'ok' | 'degraded' | 'unavailable';

export type HealthReport = {
  status: HealthStatus;
  service: string;
  version: string;
  liveTradingEnabled: boolean;
};
