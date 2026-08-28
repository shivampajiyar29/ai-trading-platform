import type { UserProfile } from './profile.js';
import type { UserSettings } from './settings.js';
import { persistenceFailure } from './errors.js';

export interface UserDirectory {
  getProfile(userId: string): UserProfile | undefined;
  saveProfile(profile: UserProfile): UserProfile;
  getSettings(userId: string): UserSettings | undefined;
  saveSettings(settings: UserSettings): UserSettings;
}

export class InMemoryUserDirectory implements UserDirectory {
  private readonly profiles = new Map<string, UserProfile>();
  private readonly settings = new Map<string, UserSettings>();
  failNextWrite = false;

  getProfile(userId: string): UserProfile | undefined {
    const found = this.profiles.get(userId);
    return found ? { ...found } : undefined;
  }

  saveProfile(profile: UserProfile): UserProfile {
    this.assertWritable();
    this.profiles.set(profile.userId, { ...profile });
    return { ...profile };
  }

  getSettings(userId: string): UserSettings | undefined {
    const found = this.settings.get(userId);
    return found ? { ...found } : undefined;
  }

  saveSettings(settings: UserSettings): UserSettings {
    this.assertWritable();
    this.settings.set(settings.userId, { ...settings });
    return { ...settings };
  }

  private assertWritable(): void {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw persistenceFailure('User directory write failed');
    }
  }
}
