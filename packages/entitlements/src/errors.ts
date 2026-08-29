export class EntitlementError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'FORBIDDEN'
      | 'ENTITLEMENT_REQUIRED',
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'EntitlementError';
  }
}

export function invalidInput(message: string): EntitlementError {
  return new EntitlementError('INVALID_INPUT', message, 400);
}

export function forbidden(message: string): EntitlementError {
  return new EntitlementError('FORBIDDEN', message, 403);
}

export function entitlementRequired(entitlement: string): EntitlementError {
  return new EntitlementError(
    'ENTITLEMENT_REQUIRED',
    `Missing entitlement: ${entitlement}`,
    403,
  );
}
