import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { invalidCredentials } from './errors.js';
import { principalFor, type Principal } from './principal.js';
import type { Role } from './roles.js';

const SCRYPT_KEYLEN = 32;

export type CredentialRecord = {
  username: string;
  passwordHash: string;
  role: Exclude<Role, 'anonymous'>;
  principalId: string;
};

export interface CredentialStore {
  findByUsername(username: string): CredentialRecord | undefined;
}

export class InMemoryCredentialStore implements CredentialStore {
  private readonly records = new Map<string, CredentialRecord>();

  register(
    username: string,
    password: string,
    role: Exclude<Role, 'anonymous'>,
    principalId = username,
  ): CredentialRecord {
    const normalized = normalizeUsername(username);
    if (this.records.has(normalized)) {
      throw new Error(`Username already registered: ${normalized}`);
    }
    const record: CredentialRecord = {
      username: normalized,
      passwordHash: hashPassword(password),
      role,
      principalId,
    };
    this.records.set(normalized, record);
    return record;
  }

  findByUsername(username: string): CredentialRecord | undefined {
    return this.records.get(normalizeUsername(username));
  }
}

export function hashPassword(password: string): string {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !parts[1] || !parts[2]) {
    return false;
  }
  const salt = parts[1];
  const expectedHex = parts[2];
  const actualHex = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  const expected = hexToBytes(expectedHex);
  const actual = hexToBytes(actualHex);
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function verifyCredentials(
  store: CredentialStore,
  username: string,
  password: string,
): Principal {
  const record = store.findByUsername(username);
  if (!record || !verifyPassword(password, record.passwordHash)) {
    throw invalidCredentials();
  }
  return principalFor(record.principalId, record.role);
}

function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    throw invalidCredentials();
  }
  return normalized;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
