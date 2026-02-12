import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumBadge } from '../components/PremiumBadge';
import { getTripDuration } from '../utils/schengenCalculator';
import { requestPermissions } from '../utils/notifications';
import { SCHENGEN_COUNTRIES } from '../constants/countries';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { hapticWarning, hapticSuccess } from '../utils/haptics';

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { settings, updateSettings, resetAll: resetSettings } = useSettingsStore();
  const { trips, clearAllTrips } = useTripStore();
  const { canUseDarkMode, canUseNotifications, canExport, isPremium } = usePremiumGate();
  const { restore, toggleDevPremium } = useSubscription();

  function navigateToPaywall() {
    navigation.navigate('Paywall');
  }

  function handleResetAll() {
    hapticWarning();
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your trips and reset all settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllTrips();
            await resetSettings();
            hapticSuccess();
          },
        },
      ]
    );
  }

  async function handleExport() {
    if (!canExport) {
      navigateToPaywall();
      return;
    }

    if (trips.length === 0) {
      Alert.alert('No Data', 'There are no trips to export.');
      return;
    }

    // Generate CSV
    const header = 'Trip Name,Country,Entry Date,Exit Date,Duration (days),Type,Notes';
    const rows = trips.map((t) => {
      const duration = getTripDuration(t);
      const name = (t.name || '').replace(/,/g, ';');
      const notes = (t.notes || '').replace(/,/g, ';');
      return `${name},${t.country || ''},${t.entryDate},${t.exitDate},${duration},${t.isPlanned ? 'Planned' : 'Past'},${notes}`;
    });

    const csv = [header, ...rows].join('\n');

    try {
      await Share.share({
        message: csv,
        title: 'SchengenTrack Trip Export',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not export trip data.');
    }
  }

  async function handleRestore() {
    const success = await restore();
    if (success) {
      Alert.alert('Restored', 'Your Pro subscription has been restored.');
    } else {
      Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
    }
  }

  function handleManageSubscription() {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Subscription */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Subscription
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Current Plan
            </Text>
            <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
              {isPremium ? 'SchengenTrack Pro' : 'Free'}
            </Text>
          </View>
          {isPremium ? (
            <View style={[styles.activeBadge, { backgroundColor: theme.statusGreen + '20' }]}>
              <Text style={[styles.activeLabel, { color: theme.statusGreen }]}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: theme.accent }]}
              onPress={navigateToPaywall}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
        {isPremium && (
          <TouchableOpacity
            style={[styles.actionRow, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            onPress={handleManageSubscription}
          >
            <Text style={[styles.actionLabel, { color: theme.primary }]}>
              Manage Subscription
            </Text>
            <Text style={{ color: theme.textSecondary }}>▶</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionRow, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          onPress={handleRestore}
        >
          <Text style={[styles.actionLabel, { color: theme.primary }]}>
            Restore Purchases
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Appearance
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Dark Mode
            </Text>
          </View>
          {canUseDarkMode ? (
            <Switch
              value={settings.darkMode}
              onValueChange={(v) => updateSettings({ darkMode: v })}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          ) : (
            <PremiumBadge onPress={navigateToPaywall} />
          )}
        </View>
      </View>

      {/* Notifications */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Notifications
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Notifications
            </Text>
            <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
              Enable push notifications
            </Text>
          </View>
          {canUseNotifications ? (
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={async (v) => {
                if (v) {
                  const granted = await requestPermissions();
                  if (!granted) {
                    Alert.alert(
                      'Permissions Required',
                      'Please enable notifications in your device settings to use this feature.'
                    );
                    return;
                  }
                }
                updateSettings({ notificationsEnabled: v });
              }}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          ) : (
            <PremiumBadge onPress={navigateToPaywall} />
          )}
        </View>
        <View style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Trip Reminders
            </Text>
            <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
              Notify before upcoming trips
            </Text>
          </View>
          {canUseNotifications ? (
            <Switch
              value={settings.tripApproachingReminder}
              onValueChange={(v) =>
                updateSettings({ tripApproachingReminder: v })
              }
              trackColor={{ true: theme.primary, false: theme.border }}
              disabled={!settings.notificationsEnabled}
            />
          ) : (
            <PremiumBadge onPress={navigateToPaywall} />
          )}
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Weekly Summary
            </Text>
            <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
              Weekly allowance status update
            </Text>
          </View>
          {canUseNotifications ? (
            <Switch
              value={settings.weeklyReminder}
              onValueChange={(v) => updateSettings({ weeklyReminder: v })}
              trackColor={{ true: theme.primary, false: theme.border }}
              disabled={!settings.notificationsEnabled}
            />
          ) : (
            <PremiumBadge onPress={navigateToPaywall} />
          )}
        </View>
      </View>

      {/* Data */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Data
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.actionRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          onPress={handleExport}
        >
          <Text style={[styles.actionLabel, { color: theme.text }]}>
            Export Trip Data (CSV)
          </Text>
          {canExport ? (
            <Text style={{ color: theme.textSecondary }}>▶</Text>
          ) : (
            <PremiumBadge />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={handleResetAll}>
          <Text style={[styles.actionLabel, { color: theme.statusRed }]}>
            Reset All Data
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        About
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
          SchengenTrack v1.0.0
        </Text>
        <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
          All data is stored locally on your device. No data is collected or
          sent to any server.
        </Text>
        <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
          This app provides guidance only. Always verify your travel dates with
          official sources before travelling.
        </Text>
        <TouchableOpacity
          style={[styles.actionRow, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[styles.actionLabel, { color: theme.text }]}>
            Privacy Policy
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionRow, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          onPress={() => navigation.navigate('Terms')}
        >
          <Text style={[styles.actionLabel, { color: theme.text }]}>
            Terms of Service
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Dev tools — only in development */}
      {__DEV__ && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.statusAmber }]}>
            Dev Tools
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Simulate Pro
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  Toggle premium to test both tiers
                </Text>
              </View>
              <Switch
                value={isPremium}
                onValueChange={toggleDevPremium}
                trackColor={{ true: theme.statusGreen, false: theme.border }}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
  },
  settingDesc: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionLabel: {
    fontSize: fontSize.md,
  },
  aboutText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    padding: spacing.md,
    paddingVertical: spacing.xs,
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  upgradeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
