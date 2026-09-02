export type SecurityError = { status: number; code: string; message: string };

export const securityError = (status: number, code: string, message: string): SecurityError => ({ status, code, message });

export function publicError(err: unknown, fallbackStatus = 500): SecurityError {
  if (err && typeof err === 'object' && 'status' in err && 'code' in err && 'message' in err) {
    const candidate = err as { status: unknown; code: unknown; message: unknown };
    if (typeof candidate.status === 'number' && typeof candidate.code === 'string' && typeof candidate.message === 'string') {
      return { status: candidate.status, code: candidate.code, message: candidate.message };
    }
  }
  return { status: fallbackStatus, code: 'INTERNAL_ERROR', message: 'An internal error occurred' };
}
