import { ANONYMOUS_PRINCIPAL, type Principal } from './principal.js';
import { unauthorized } from './errors.js';
import type { SessionStore } from './sessions.js';
import { requireSession } from './sessions.js';

export function parseBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }
  const trimmed = authorizationHeader.trim();
  if (!trimmed) {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);
  if (!match) {
    throw unauthorized('Authorization header must use Bearer scheme');
  }
  return match[1];
}

/**
 * Missing Authorization yields the anonymous principal.
 * A present but invalid token is unauthorized (never silently anonymous).
 */
export function authenticate(
  authorizationHeader: string | undefined,
  sessions: SessionStore,
): Principal {
  const token = parseBearerToken(authorizationHeader);
  if (!token) {
    return ANONYMOUS_PRINCIPAL;
  }
  return requireSession(sessions, token).principal;
}
