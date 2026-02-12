import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { DatePickerField } from '../components/DatePickerField';
import {
  isTripCompliant,
  getMaxStayFrom,
  getEarliestAvailableDate,
  getDailyBreakdown,
  toUTCDate,
  formatDate,
  addUTCDays,
} from '../utils/schengenCalculator';
import { Trip, DayStatus } from '../types';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { format, differenceInDays } from 'date-fns';

type SimMode = 'check' | 'maxStay' | 'earliest';

export function SimulatorScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const trips = useTripStore((s) => s.trips);
  const { canUseSimulator } = usePremiumGate();
  const [mode, setMode] = useState<SimMode>('check');

  // Check trip mode
  const [checkStart, setCheckStart] = useState<string | null>(null);
  const [checkEnd, setCheckEnd] = useState<string | null>(null);

  // Max stay mode
  const [maxStayDate, setMaxStayDate] = useState<string | null>(null);

  // Earliest date mode
  const [requiredDays, setRequiredDays] = useState('');
  const [searchFrom, setSearchFrom] = useState<string | null>(null);

  // Results
  const checkResult = useMemo(() => {
    if (mode !== 'check' || !checkStart || !checkEnd) return null;
    if (checkEnd < checkStart) return null;
    const tempTrip: Trip = {
      id: 'sim',
      country: 'France',
      entryDate: checkStart,
      exitDate: checkEnd,
      isPlanned: true,
      createdAt: '',
      updatedAt: '',
    };
    const compliance = isTripCompliant(trips, tempTrip);
    const breakdown = getDailyBreakdown(
      [...trips, tempTrip],
      toUTCDate(checkStart),
      toUTCDate(checkEnd)
    );
    return { compliance, breakdown, tripDays: differenceInDays(toUTCDate(checkEnd), toUTCDate(checkStart)) + 1 };
  }, [mode, checkStart, checkEnd, trips]);

  const maxStayResult = useMemo(() => {
    if (mode !== 'maxStay' || !maxStayDate) return null;
    const maxDays = getMaxStayFrom(trips, toUTCDate(maxStayDate));
    return { maxDays, startDate: maxStayDate };
  }, [mode, maxStayDate, trips]);

  const earliestResult = useMemo(() => {
    if (mode !== 'earliest' || !searchFrom || !requiredDays) return null;
    const days = parseInt(requiredDays, 10);
    if (isNaN(days) || days <= 0 || days > 90) return null;
    const result = getEarliestAvailableDate(trips, days, toUTCDate(searchFrom));
    return { date: result, requiredDays: days };
  }, [mode, searchFrom, requiredDays, trips]);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          What If? Planner
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Simulate trips to check your Schengen allowance.
        </Text>

        {/* Mode tabs */}
        <View style={styles.modeRow}>
          {[
            { key: 'check' as SimMode, label: 'Check Trip' },
            { key: 'maxStay' as SimMode, label: 'Max Stay' },
            { key: 'earliest' as SimMode, label: 'Find Date' },
          ].map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.modeTab,
                { borderColor: theme.border },
                mode === m.key && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setMode(m.key)}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: theme.textSecondary },
                  mode === m.key && { color: '#ffffff' },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Check trip mode */}
        {mode === 'check' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Start date
            </Text>
            <DatePickerField label="Start" value={checkStart} onSelect={setCheckStart} />

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              End date
            </Text>
            <DatePickerField
              label="End"
              value={checkEnd}
              onSelect={setCheckEnd}
              minimumDate={checkStart || undefined}
            />

            {checkResult && (
              <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                <Text
                  style={[
                    styles.resultTitle,
                    {
                      color: checkResult.compliance.compliant
                        ? theme.statusGreen
                        : theme.statusRed,
                    },
                  ]}
                >
                  {checkResult.compliance.compliant
                    ? 'This trip is compliant!'
                    : 'This trip would exceed your allowance'}
                </Text>
                <Text style={[styles.resultDetail, { color: theme.text }]}>
                  Trip duration: {checkResult.tripDays} day{checkResult.tripDays !== 1 ? 's' : ''}
                </Text>
                {!checkResult.compliance.compliant && (
                  <>
                    <Text style={[styles.resultDetail, { color: theme.statusRed }]}>
                      Overstay: {checkResult.compliance.overstayDays} day(s)
                    </Text>
                    <Text style={[styles.resultDetail, { color: theme.text }]}>
                      Maximum compliant stay: {checkResult.compliance.maxDays} days
                    </Text>
                  </>
                )}

                {/* Daily breakdown (show first and last few days) */}
                <Text style={[styles.breakdownTitle, { color: theme.textSecondary }]}>
                  Daily Breakdown
                </Text>
                {checkResult.breakdown.slice(0, 7).map((day) => (
                  <View key={day.date} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownDate, { color: theme.text }]}>
                      {format(toUTCDate(day.date), 'dd MMM')}
                    </Text>
                    <Text
                      style={[
                        styles.breakdownRemaining,
                        {
                          color: day.isCompliant ? theme.statusGreen : theme.statusRed,
                        },
                      ]}
                    >
                      {day.daysRemaining >= 0
                        ? `${day.daysRemaining} remaining`
                        : `OVERSTAY ${Math.abs(day.daysRemaining)}d`}
                    </Text>
                  </View>
                ))}
                {checkResult.breakdown.length > 7 && (
                  <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                    ... and {checkResult.breakdown.length - 7} more days
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Max stay mode */}
        {mode === 'maxStay' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Starting from
            </Text>
            <DatePickerField
              label="Start date"
              value={maxStayDate}
              onSelect={setMaxStayDate}
            />

            {maxStayResult && (
              <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.resultTitle, { color: theme.primary }]}>
                  Maximum stay: {maxStayResult.maxDays} day{maxStayResult.maxDays !== 1 ? 's' : ''}
                </Text>
                {maxStayResult.maxDays > 0 && (
                  <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
                    You could stay from{' '}
                    {format(toUTCDate(maxStayResult.startDate), 'dd MMM yyyy')} to{' '}
                    {format(
                      addUTCDays(toUTCDate(maxStayResult.startDate), maxStayResult.maxDays - 1),
                      'dd MMM yyyy'
                    )}
                  </Text>
                )}
                {maxStayResult.maxDays === 0 && (
                  <Text style={[styles.resultDetail, { color: theme.statusRed }]}>
                    You have no remaining allowance on this date.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Earliest date mode */}
        {mode === 'earliest' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              How many days do you need?
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g., 14"
              placeholderTextColor={theme.textSecondary}
              value={requiredDays}
              onChangeText={setRequiredDays}
              keyboardType="numeric"
            />

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Search from
            </Text>
            <DatePickerField
              label="Search from"
              value={searchFrom}
              onSelect={setSearchFrom}
            />

            {earliestResult && (
              <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                {earliestResult.date ? (
                  <>
                    <Text style={[styles.resultTitle, { color: theme.statusGreen }]}>
                      Available from{' '}
                      {format(earliestResult.date, 'dd MMMM yyyy')}
                    </Text>
                    <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
                      You can stay {earliestResult.requiredDays} days starting from
                      this date.
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.resultTitle, { color: theme.statusRed }]}>
                    No available date found within the next year.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Premium overlay */}
      {!canUseSimulator && (
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="lock-closed" size={32} color={theme.accent} />
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              Pro Feature
            </Text>
            <Text style={[styles.overlayText, { color: theme.textSecondary }]}>
              The What If? Planner is available with SchengenTrack Pro. Simulate trips and plan ahead.
            </Text>
            <TouchableOpacity
              style={[styles.overlayBtn, { backgroundColor: theme.accent }]}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Text style={styles.overlayBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
  },
  resultCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  resultDetail: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  breakdownTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownDate: {
    fontSize: fontSize.sm,
  },
  breakdownRemaining: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  moreText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  overlayCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  overlayTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  overlayText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  overlayBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  overlayBtnText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
