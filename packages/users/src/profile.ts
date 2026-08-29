import { invalidInput } from './errors.js';

export type UserProfile = {
  userId: string;
  displayName: string;
  locale: string;
  timezone: string;
  country: string;
  preferredCurrency: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfilePatch = {
  displayName?: string;
  locale?: string;
  timezone?: string;
  country?: string;
  preferredCurrency?: string;
};

const DISPLAY_NAME_MAX = 80;
const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const TIMEZONE_RE = /^(UTC|[A-Za-z]+\/[A-Za-z0-9_+\-]+)$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

export function defaultProfile(userId: string, now: string): UserProfile {
  return {
    userId,
    displayName: userId,
    locale: 'en',
    timezone: 'UTC',
    country: 'US',
    preferredCurrency: 'USD',
    createdAt: now,
    updatedAt: now,
  };
}

export function applyProfilePatch(current: UserProfile, patch: ProfilePatch, now: string): UserProfile {
  return {
    userId: current.userId,
    displayName: patch.displayName !== undefined ? sanitizeDisplayName(patch.displayName) : current.displayName,
    locale: patch.locale !== undefined ? sanitizeLocale(patch.locale) : current.locale,
    timezone: patch.timezone !== undefined ? sanitizeTimezone(patch.timezone) : current.timezone,
    country: patch.country !== undefined ? sanitizeCountry(patch.country) : current.country,
    preferredCurrency:
      patch.preferredCurrency !== undefined
        ? sanitizeCurrency(patch.preferredCurrency)
        : current.preferredCurrency,
    createdAt: current.createdAt,
    updatedAt: now,
  };
}

export function parseProfilePatch(input: unknown): ProfilePatch {
  const obj = requirePlainObject(input);
  rejectForbiddenKeys(obj, ['userId', 'id', 'role', 'password', 'passwordHash', 'token', 'createdAt']);
  const patch: ProfilePatch = {};
  if ('displayName' in obj) {
    patch.displayName = expectString(obj.displayName, 'displayName');
  }
  if ('locale' in obj) {
    patch.locale = expectString(obj.locale, 'locale');
  }
  if ('timezone' in obj) {
    patch.timezone = expectString(obj.timezone, 'timezone');
  }
  if ('country' in obj) {
    patch.country = expectString(obj.country, 'country');
  }
  if ('preferredCurrency' in obj) {
    patch.preferredCurrency = expectString(obj.preferredCurrency, 'preferredCurrency');
  }
  return patch;
}

export function toProfileView(profile: UserProfile): UserProfile {
  return { ...profile };
}

function sanitizeDisplayName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > DISPLAY_NAME_MAX) {
    throw invalidInput('displayName must be 1–80 characters');
  }
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    throw invalidInput('displayName contains invalid characters');
  }
  return trimmed;
}

function sanitizeLocale(value: string): string {
  const trimmed = value.trim();
  if (!LOCALE_RE.test(trimmed)) {
    throw invalidInput('locale must look like en or en-US');
  }
  return trimmed;
}

function sanitizeTimezone(value: string): string {
  const trimmed = value.trim();
  if (!TIMEZONE_RE.test(trimmed)) {
    throw invalidInput('timezone must be UTC or an Area/City IANA name');
  }
  return trimmed;
}

function sanitizeCountry(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!COUNTRY_RE.test(trimmed)) {
    throw invalidInput('country must be an ISO 3166-1 alpha-2 code');
  }
  return trimmed;
}

function sanitizeCurrency(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!CURRENCY_RE.test(trimmed)) {
    throw invalidInput('preferredCurrency must be a 3-letter code');
  }
  return trimmed;
}

export function requirePlainObject(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidInput('Request body must be a JSON object');
  }
  return input as Record<string, unknown>;
}

export function rejectForbiddenKeys(obj: Record<string, unknown>, keys: string[]): void {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      throw invalidInput(`Field is not writable: ${key}`);
    }
  }
}

export function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw invalidInput(`${field} must be a string`);
  }
  return value;
}
