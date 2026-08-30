import { forbidden, notFound } from './errors.js';
import {
  applyProfilePatch,
  defaultProfile,
  parseProfilePatch,
  toProfileView,
  type UserProfile,
} from './profile.js';
import type { UserDirectory } from './repository.js';
import {
  applySettingsPatch,
  defaultSettings,
  parseSettingsPatch,
  toSettingsView,
} from './settings.js';

export type Clock = () => string;

export type UserAudit = {
  record(type: string, actorId: string, outcome: 'success' | 'denied' | 'failure', details?: Record<string, unknown>): void;
};

export class UserService {
  constructor(
    private readonly directory: UserDirectory,
    private readonly now: Clock = () => new Date().toISOString(),
    private readonly audit?: UserAudit,
  ) {}

  getProfile(userId: string): UserProfile {
    const existing = this.directory.getProfile(requireUserId(userId));
    if (existing) {
      return toProfileView(existing);
    }
    return toProfileView(this.directory.saveProfile(defaultProfile(userId, this.now())));
  }

  updateProfile(userId: string, patch: unknown): UserProfile {
    const current = this.getProfile(userId);
    const parsed = parseProfilePatch(patch);
    const next = applyProfilePatch(current, parsed, this.now());
    const saved = toProfileView(this.directory.saveProfile(next));
    this.audit?.record('PROFILE_UPDATED', userId, 'success', { fields: Object.keys(parsed) });
    return saved;
  }

  getSettings(userId: string): ReturnType<typeof toSettingsView> {
    const existing = this.directory.getSettings(requireUserId(userId));
    if (existing) {
      return toSettingsView(existing);
    }
    return toSettingsView(this.directory.saveSettings(defaultSettings(userId, this.now())));
  }

  updateSettings(userId: string, patch: unknown): ReturnType<typeof toSettingsView> {
    const current = this.getSettings(userId);
    const parsed = parseSettingsPatch(patch);
    const next = applySettingsPatch(current, parsed, this.now());
    const saved = toSettingsView(this.directory.saveSettings(next));
    this.audit?.record('SETTINGS_UPDATED', userId, 'success', { fields: Object.keys(parsed) });
    return saved;
  }
}

export function requireOwnedUserId(principalId: string, requestedUserId: string | undefined): string {
  const owner = requireUserId(principalId);
  if (requestedUserId !== undefined && requestedUserId.trim() !== '' && requestedUserId !== owner) {
    throw forbidden('Cannot access another user resource');
  }
  return owner;
}

function requireUserId(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed || trimmed === 'anonymous') {
    throw notFound('Profile not found');
  }
  return trimmed;
}
