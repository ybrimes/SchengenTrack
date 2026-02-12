import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { FREE_TRIP_LIMIT } from '../constants/subscription';

const { width } = Dimensions.get('window');

interface Step {
  title: string;
  body: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to SchengenTrack',
    body: 'Track your Schengen Area travel days and stay compliant with the 90/180-day rule.',
    icon: 'shield-checkmark-outline',
  },
  {
    title: 'The 90/180-Day Rule',
    body: 'As a UK citizen, you can spend up to 90 days in any rolling 180-day period in the Schengen Area. Both entry and exit days count.',
    icon: 'calendar-outline',
  },
  {
    title: 'Log Your Trips',
    body: 'Add your past and planned trips. The app will calculate your remaining days and warn you if you\'re at risk of overstaying.',
    icon: 'create-outline',
  },
  {
    title: 'Free & Pro',
    body: `Track up to ${FREE_TRIP_LIMIT} trips for free. Upgrade to Pro for unlimited trips, trip simulator, notifications, dark mode, and CSV export.`,
    icon: 'star-outline',
  },
  {
    title: 'You\'re All Set!',
    body: 'Start by adding any recent Schengen trips. Your dashboard will update automatically.',
    icon: 'checkmark-done-outline',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (isLast) {
      await completeOnboarding();
    } else {
      setStep(step + 1);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name={current.icon as any} size={48} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {current.title}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {current.body}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === step ? theme.primary : theme.border,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text style={[styles.backText, { color: theme.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={completeOnboarding}>
            <Text style={[styles.backText, { color: theme.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {isLast ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: width * 0.8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: fontSize.md,
    padding: spacing.md,
  },
  nextButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  nextText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
