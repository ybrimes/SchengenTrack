import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'schengentrack_settings';
const ONBOARDING_KEY = 'schengentrack_onboarding_done';

interface Settings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  weeklyReminder: boolean;
  tripApproachingReminder: boolean;
}

interface SettingsStore {
  settings: Settings;
  hasCompletedOnboarding: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const defaultSettings: Settings = {
  darkMode: false,
  notificationsEnabled: true,
  weeklyReminder: false,
  tripApproachingReminder: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  hasCompletedOnboarding: false,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const [settingsData, onboardingData] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      const settings = settingsData
        ? { ...defaultSettings, ...JSON.parse(settingsData) }
        : defaultSettings;
      const hasCompletedOnboarding = onboardingData === 'true';
      set({ settings, hasCompletedOnboarding, isLoaded: true });
    } catch {
      set({ settings: defaultSettings, hasCompletedOnboarding: false, isLoaded: true });
    }
  },

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  },

  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  resetAll: async () => {
    set({ settings: defaultSettings, hasCompletedOnboarding: false });
    await AsyncStorage.multiRemove([SETTINGS_KEY, ONBOARDING_KEY]);
  },
}));
