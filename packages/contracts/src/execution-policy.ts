import { AppError, ErrorCodes } from './app-error.js';
import type { FeatureFlags } from './feature-flags.js';
import type { TradingMode } from './trading-mode.js';

export type ExecutionPath = 'paper' | 'live' | 'blocked';

export type ExecutionPolicyInput = {
  requestedMode: TradingMode;
  flags: FeatureFlags;
  killSwitchActive: boolean;
};

/**
 * Deterministic execution routing.
 * Live path is available only when explicitly requested AND flagged on AND kill switch is off.
 * Paper never routes to live.
 */
export function resolveExecutionPath(input: ExecutionPolicyInput): ExecutionPath {
  if (input.requestedMode === 'paper') {
    return 'paper';
  }

  if (input.killSwitchActive) {
    return 'blocked';
  }

  if (!input.flags.liveTradingEnabled) {
    return 'blocked';
  }

  return 'live';
}

export function assertExecutionAllowed(input: ExecutionPolicyInput): ExecutionPath {
  const path = resolveExecutionPath(input);
  if (path !== 'blocked') {
    return path;
  }

  if (input.requestedMode === 'live' && input.killSwitchActive) {
    throw new AppError(
      ErrorCodes.KILL_SWITCH_ACTIVE,
      'Live trading is blocked by the emergency kill switch',
      403,
    );
  }

  if (input.requestedMode === 'live' && !input.flags.liveTradingEnabled) {
    throw new AppError(
      ErrorCodes.LIVE_TRADING_DISABLED,
      'Live trading is disabled by default and is not enabled in this environment',
      403,
    );
  }

  throw new AppError(ErrorCodes.EXECUTION_BLOCKED, 'Execution is blocked', 403);
}
