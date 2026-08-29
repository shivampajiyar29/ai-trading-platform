export class UserError extends Error {
  constructor(
    public readonly code: 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'PERSISTENCE_FAILURE',
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'UserError';
  }
}

export function invalidInput(message: string): UserError {
  return new UserError('INVALID_INPUT', message, 400);
}

export function notFound(message: string): UserError {
  return new UserError('NOT_FOUND', message, 404);
}

export function forbidden(message: string): UserError {
  return new UserError('FORBIDDEN', message, 403);
}

export function persistenceFailure(message: string): UserError {
  return new UserError('PERSISTENCE_FAILURE', message, 500);
}
