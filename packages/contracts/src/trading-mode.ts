export const TRADING_MODES = ['paper', 'live'] as const;

export type TradingMode = (typeof TRADING_MODES)[number];

export function isTradingMode(value: string): value is TradingMode {
  return (TRADING_MODES as readonly string[]).includes(value);
}

export function parseTradingMode(value: string): TradingMode {
  const normalized = value.trim().toLowerCase();
  if (!isTradingMode(normalized)) {
    throw new Error(`Invalid trading mode: ${value}`);
  }
  return normalized;
}
