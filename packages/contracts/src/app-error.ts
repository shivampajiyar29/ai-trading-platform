export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  LIVE_TRADING_DISABLED: 'LIVE_TRADING_DISABLED',
  KILL_SWITCH_ACTIVE: 'KILL_SWITCH_ACTIVE',
  EXECUTION_BLOCKED: 'EXECUTION_BLOCKED',
} as const;
