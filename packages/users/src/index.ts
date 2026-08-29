export { UserError, forbidden, invalidInput, notFound, persistenceFailure } from './errors.js';
export {
  applyProfilePatch,
  defaultProfile,
  parseProfilePatch,
  toProfileView,
} from './profile.js';
export type { ProfilePatch, UserProfile } from './profile.js';
export { InMemoryUserDirectory } from './repository.js';
export type { UserDirectory } from './repository.js';
export { requireOwnedUserId, UserService } from './service.js';
export {
  applySettingsPatch,
  defaultSettings,
  parseSettingsPatch,
  toSettingsView,
} from './settings.js';
export type { SettingsPatch, Theme, TradingModePreference, UserSettings } from './settings.js';
