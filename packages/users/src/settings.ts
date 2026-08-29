import { invalidInput } from './errors.js';
import { expectString, rejectForbiddenKeys, requirePlainObject } from './profile.js';

export type Theme = 'light' | 'dark' | 'system';
export type TradingModePreference = 'paper' | 'live';

export type UserSettings = {
  userId: string;
  language: string;
  timezone: string;
  theme: Theme;
  chartShowVolume: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  /**
   * UI preference only. Never enables live trading or bypasses risk.
   */
  defaultTradingModePreference: TradingModePreference;
  updatedAt: string;
};

export type SettingsPatch = {
  language?: string;
  timezone?: string;
  theme?: Theme;
  chartShowVolume?: boolean;
  notificationsEmail?: boolean;
  notificationsPush?: boolean;
  defaultTradingModePreference?: TradingModePreference;
};

const LANGUAGE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const TIMEZONE_RE = /^(UTC|[A-Za-z]+\/[A-Za-z0-9_+\-]+)$/;

export function defaultSettings(userId: string, now: string): UserSettings {
  return {
    userId,
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    chartShowVolume: true,
    notificationsEmail: false,
    notificationsPush: false,
    defaultTradingModePreference: 'paper',
    updatedAt: now,
  };
}

export function applySettingsPatch(current: UserSettings, patch: SettingsPatch, now: string): UserSettings {
  return {
    userId: current.userId,
    language: patch.language !== undefined ? sanitizeLanguage(patch.language) : current.language,
    timezone: patch.timezone !== undefined ? sanitizeTimezone(patch.timezone) : current.timezone,
    theme: patch.theme !== undefined ? patch.theme : current.theme,
    chartShowVolume: patch.chartShowVolume ?? current.chartShowVolume,
    notificationsEmail: patch.notificationsEmail ?? current.notificationsEmail,
    notificationsPush: patch.notificationsPush ?? current.notificationsPush,
    defaultTradingModePreference:
      patch.defaultTradingModePreference ?? current.defaultTradingModePreference,
    updatedAt: now,
  };
}

export function parseSettingsPatch(input: unknown): SettingsPatch {
  const obj = requirePlainObject(input);
  rejectForbiddenKeys(obj, [
    'userId',
    'id',
    'role',
    'liveTradingEnabled',
    'automatedLiveTradingEnabled',
    'killSwitchActive',
    'password',
    'token',
  ]);
  const patch: SettingsPatch = {};
  if ('language' in obj) {
    patch.language = expectString(obj.language, 'language');
  }
  if ('timezone' in obj) {
    patch.timezone = expectString(obj.timezone, 'timezone');
  }
  if ('theme' in obj) {
    patch.theme = parseTheme(obj.theme);
  }
  if ('chartShowVolume' in obj) {
    patch.chartShowVolume = expectBoolean(obj.chartShowVolume, 'chartShowVolume');
  }
  if ('notificationsEmail' in obj) {
    patch.notificationsEmail = expectBoolean(obj.notificationsEmail, 'notificationsEmail');
  }
  if ('notificationsPush' in obj) {
    patch.notificationsPush = expectBoolean(obj.notificationsPush, 'notificationsPush');
  }
  if ('defaultTradingModePreference' in obj) {
    patch.defaultTradingModePreference = parseModePreference(obj.defaultTradingModePreference);
  }
  return patch;
}

export function toSettingsView(settings: UserSettings): UserSettings & { liveTradingEnabledByPreference: false } {
  return {
    ...settings,
    liveTradingEnabledByPreference: false,
  };
}

function sanitizeLanguage(value: string): string {
  const trimmed = value.trim();
  if (!LANGUAGE_RE.test(trimmed)) {
    throw invalidInput('language must look like en or en-US');
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

function parseTheme(value: unknown): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  throw invalidInput('theme must be light, dark, or system');
}

function parseModePreference(value: unknown): TradingModePreference {
  if (value === 'paper' || value === 'live') {
    return value;
  }
  throw invalidInput('defaultTradingModePreference must be paper or live');
}

function expectBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalidInput(`${field} must be a boolean`);
  }
  return value;
}
