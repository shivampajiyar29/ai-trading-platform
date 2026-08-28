export class AuthError extends Error {
  constructor(
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_CREDENTIALS',
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function unauthorized(message = 'Authentication required'): AuthError {
  return new AuthError('UNAUTHORIZED', message, 401);
}

export function forbidden(message = 'Insufficient permissions'): AuthError {
  return new AuthError('FORBIDDEN', message, 403);
}

export function invalidCredentials(): AuthError {
  return new AuthError('INVALID_CREDENTIALS', 'Invalid username or password', 401);
}
