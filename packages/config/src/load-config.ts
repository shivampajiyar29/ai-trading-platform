export type NodeEnv = 'development' | 'test' | 'production';

export type AppConfig = {
  nodeEnv: NodeEnv;
  serviceName: string;
  version: string;
  tradingMode: 'paper' | 'live';
  liveTradingEnabled: boolean;
  automatedLiveTradingEnabled: boolean;
  killSwitchActive: boolean;
};

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  throw new Error(`Invalid boolean flag: ${value}`);
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const normalized = (value ?? 'development').trim().toLowerCase();
  if (normalized === 'development' || normalized === 'test' || normalized === 'production') {
    return normalized;
  }
  throw new Error(`Invalid NODE_ENV: ${value}`);
}

function parseTradingMode(value: string | undefined): 'paper' | 'live' {
  const normalized = (value ?? 'paper').trim().toLowerCase();
  if (normalized === 'paper' || normalized === 'live') {
    return normalized;
  }
  throw new Error(`Invalid TRADING_MODE: ${value}`);
}

/**
 * Load process configuration.
 * Live trading and automated live trading default to OFF.
 */
export function loadConfig(env: Record<string, string | undefined> = {}): AppConfig {
  return {
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    serviceName: (env.SERVICE_NAME ?? 'api-gateway').trim() || 'api-gateway',
    version: (env.APP_VERSION ?? '0.1.0').trim() || '0.1.0',
    tradingMode: parseTradingMode(env.TRADING_MODE),
    liveTradingEnabled: parseBooleanFlag(env.LIVE_TRADING_ENABLED, false),
    automatedLiveTradingEnabled: parseBooleanFlag(env.AUTOMATED_LIVE_TRADING_ENABLED, false),
    killSwitchActive: parseBooleanFlag(env.TRADING_KILL_SWITCH, false),
  };
}
