import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../constants/theme';

export function useTheme() {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  return darkMode ? colors.dark : colors.light;
}
