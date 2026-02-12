import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { ProgressRing } from '../components/ProgressRing';
import { DatePickerField } from '../components/DatePickerField';
import {
  getDaysUsed,
  getDaysRemaining,
  getMaxStayFrom,
  getRunOutDate,
  getStatusColor,
  toUTCDate,
  formatDate,
} from '../utils/schengenCalculator';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { FREE_TRIP_LIMIT } from '../constants/subscription';
import { format, differenceInDays } from 'date-fns';
import { SCHENGEN_COUNTRIES } from '../constants/countries';

export function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const trips = useTripStore((s) => s.trips);
  const { isPremium, tripsRemaining, canAddTrip } = usePremiumGate();
  const { width } = useWindowDimensions();

  const todayDate = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);
  const todayStr = formatDate(todayDate);

  const [perspectiveDate, setPerspectiveDate] = useState<string | null>(null);
  const isViewingFuture = perspectiveDate !== null && perspectiveDate !== todayStr;

  const viewDate = useMemo(
    () => (perspectiveDate ? toUTCDate(perspectiveDate) : todayDate),
    [perspectiveDate, todayDate]
  );
  const viewDateStr = perspectiveDate || todayStr;

  const daysUsed = useMemo(() => getDaysUsed(trips, viewDate), [trips, viewDate]);
  const daysRemaining = useMemo(() => getDaysRemaining(trips, viewDate), [trips, viewDate]);
  const statusColor = useMemo(() => getStatusColor(daysRemaining), [daysRemaining]);
  const maxStay = useMemo(() => getMaxStayFrom(trips, viewDate), [trips, viewDate]);
  const runOutDate = useMemo(() => getRunOutDate(trips, viewDate), [trips, viewDate]);

  const nextTrip = useMemo(() => {
    return trips.find((t) => t.isPlanned && t.entryDate > viewDateStr);
  }, [trips, viewDateStr]);

  const nextTripCountdown = useMemo(() => {
    if (!nextTrip) return null;
    const entry = toUTCDate(nextTrip.entryDate);
    return differenceInDays(entry, viewDate);
  }, [nextTrip, viewDate]);

  const statusColorMap = {
    green: theme.statusGreen,
    amber: theme.statusAmber,
    red: theme.statusRed,
    'flashing-red': theme.statusFlashingRed,
  };

  const ringColor = statusColorMap[statusColor];
  const ringProgress = Math.max(0, daysRemaining) / 90;
  const ringSize = Math.min(width * 0.6, 240);

  const countryInfo = nextTrip?.country
    ? SCHENGEN_COUNTRIES.find((c) => c.name === nextTrip.country)
    : null;

  const perspectiveLabel = isViewingFuture
    ? `As of ${format(viewDate, 'dd MMM yyyy')}`
    : 'Today';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Perspective date selector */}
      <View style={[styles.perspectiveCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.perspectiveLabel, { color: theme.textSecondary }]}>
          View allowance as of
        </Text>
        <View style={styles.perspectiveRow}>
          <TouchableOpacity
            style={[
              styles.perspectiveTab,
              !isViewingFuture && { backgroundColor: theme.primary },
              { borderColor: theme.border },
            ]}
            onPress={() => setPerspectiveDate(null)}
          >
            <Text style={[
              styles.perspectiveTabText,
              { color: isViewingFuture ? theme.text : '#ffffff' },
            ]}>
              Today
            </Text>
          </TouchableOpacity>
          <View style={styles.perspectiveDatePicker}>
            <DatePickerField
              label="Future date"
              value={isViewingFuture ? perspectiveDate : null}
              onSelect={(date) => setPerspectiveDate(date)}
            />
          </View>
        </View>
      </View>

      {/* Future perspective banner */}
      {isViewingFuture && (
        <View style={[styles.futureBanner, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}>
          <Text style={[styles.futureBannerText, { color: theme.accent }]}>
            Showing your allowance as of {format(viewDate, 'dd MMMM yyyy')} — includes all planned trips
          </Text>
        </View>
      )}

      {/* Main progress ring */}
      <View style={styles.ringSection}>
        <ProgressRing
          progress={ringProgress}
          size={ringSize}
          strokeWidth={12}
          color={ringColor}
          backgroundColor={theme.border}
        >
          <Text style={[styles.daysNumber, { color: ringColor }]}>
            {Math.max(0, daysRemaining)}
          </Text>
          <Text style={[styles.daysLabel, { color: theme.textSecondary }]}>
            days remaining
          </Text>
          {isViewingFuture && (
            <Text style={[styles.perspectiveHint, { color: theme.textSecondary }]}>
              {perspectiveLabel}
            </Text>
          )}
        </ProgressRing>
      </View>

      {/* Overstay warning */}
      {daysRemaining < 0 && (
        <View style={[styles.warningBanner, { backgroundColor: theme.statusFlashingRed }]}>
          <Text style={styles.warningText}>
            {isViewingFuture ? 'OVERSTAY WARNING' : 'OVERSTAY WARNING'}: {isViewingFuture ? 'You would exceed' : 'You have exceeded'} your 90-day allowance by{' '}
            {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 ? 's' : ''}!
          </Text>
        </View>
      )}

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{daysUsed}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Days used{'\n'}(180-day window)
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{maxStay}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Max stay{'\n'}from {isViewingFuture ? 'this date' : 'today'}
          </Text>
        </View>
      </View>

      {/* Run-out date */}
      {runOutDate && (
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
            If you entered {isViewingFuture ? 'on this date' : 'today'} and stayed continuously, your 90 days would run out on:
          </Text>
          <Text style={[styles.infoValue, { color: theme.primary }]}>
            {format(runOutDate, 'dd MMMM yyyy')}
          </Text>
        </View>
      )}

      {/* Next trip */}
      {nextTrip && nextTripCountdown !== null && (
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
            Next planned trip
          </Text>
          <View style={styles.nextTripRow}>
            {countryInfo ? (
              <Text style={styles.nextTripFlag}>{countryInfo.flag}</Text>
            ) : (
              <Ionicons name="airplane" size={20} color={theme.primary} style={{ marginRight: spacing.sm }} />
            )}
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {nextTrip.name || nextTrip.country || 'Schengen Trip'}
            </Text>
          </View>
          <Text style={[styles.infoSub, { color: theme.primary }]}>
            {nextTripCountdown === 0
              ? `${isViewingFuture ? 'On this date' : 'Today'}!`
              : nextTripCountdown === 1
              ? `${isViewingFuture ? '1 day after' : 'Tomorrow'}`
              : `In ${nextTripCountdown} days`}
          </Text>
        </View>
      )}

      {/* Empty state */}
      {trips.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No trips yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add your past and planned Schengen Area trips to start tracking your 90-day allowance.
          </Text>
        </View>
      )}

      {/* Plan badge */}
      <View style={[styles.planBadgeRow, { backgroundColor: theme.surface }]}>
        <Text style={[styles.planBadgeText, { color: theme.textSecondary }]}>
          {isPremium
            ? 'Pro'
            : tripsRemaining > 0
            ? `Free · ${tripsRemaining} trip${tripsRemaining !== 1 ? 's' : ''} remaining`
            : 'Free · 0 trips remaining'}
        </Text>
      </View>

      {/* Upgrade banner — shown after free limit reached */}
      {!isPremium && !canAddTrip && (
        <TouchableOpacity
          style={[styles.upgradeBanner, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Ionicons name="sparkles-outline" size={18} color={theme.accent} />
          <Text style={[styles.upgradeBannerText, { color: theme.accent }]}>
            Upgrade to Pro for unlimited trips, planner & more
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick add button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => {
          if (canAddTrip) {
            navigation.navigate('Trips', { screen: 'AddTrip' });
          } else {
            navigation.navigate('Paywall');
          }
        }}
      >
        <View style={styles.addButtonContent}>
          <Ionicons name="add-circle-outline" size={22} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Trip</Text>
        </View>
      </TouchableOpacity>
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
  perspectiveCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  perspectiveLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  perspectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perspectiveTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  perspectiveTabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  perspectiveDatePicker: {
    flex: 1,
  },
  futureBanner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  futureBannerText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  ringSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  daysNumber: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    lineHeight: fontSize.hero * 1.1,
  },
  daysLabel: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  perspectiveHint: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  warningBanner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  infoSub: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  nextTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextTripFlag: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  planBadgeRow: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  upgradeBannerText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  addButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
