import { randomBytes, timingSafeEqual } from 'node:crypto';
import { unauthorized } from './errors.js';
import type { Principal } from './principal.js';
import type { SecurityAudit } from './security-audit.js';

export type Session = {
  token: string;
  principal: Principal;
  expiresAt: number;
};

export interface SessionStore {
  issue(principal: Principal, ttlMs?: number): Session;
  find(token: string): Session | undefined;
  revoke(token: string): void;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000;

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly audit?: SecurityAudit) {}

  issue(principal: Principal, ttlMs = DEFAULT_TTL_MS): Session {
    const token = `sess_${randomBytes(24).toString('hex')}`;
    const session: Session = {
      token,
      principal,
      expiresAt: Date.now() + ttlMs,
    };
    this.sessions.set(token, session);
    this.audit?.record('SESSION_CREATED', principal.id, 'success', { role: principal.role });
    return session;
  }

  find(token: string): Session | undefined {
    const session = this.lookup(token);
    if (!session) {
      return undefined;
    }
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(session.token);
      return undefined;
    }
    return session;
  }

  revoke(token: string): void {
    const session = this.lookup(token);
    if (session) {
      this.sessions.delete(session.token);
      this.audit?.record('SESSION_REVOKED', session.principal.id, 'success', { role: session.principal.role });
    }
  }

  private lookup(token: string): Session | undefined {
    const incoming = stringToBytes(token);
    for (const [stored, session] of this.sessions) {
      const storedBytes = stringToBytes(stored);
      if (storedBytes.length !== incoming.length) {
        continue;
      }
      if (timingSafeEqual(storedBytes, incoming)) {
        return session;
      }
    }
    return undefined;
  }
}

export function requireSession(store: SessionStore, token: string): Session {
  const session = store.find(token);
  if (!session) {
    throw unauthorized('Invalid or expired session');
  }
  return session;
}

function stringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) {
    bytes[i] = value.charCodeAt(i) & 0xff;
  }
  return bytes;
}
