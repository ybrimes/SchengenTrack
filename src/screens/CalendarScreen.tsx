import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  AppState,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { PremiumBadge } from '../components/PremiumBadge';
import { SCHENGEN_COUNTRIES } from '../constants/countries';
import {
  getDaysRemaining,
  isTripCompliant,
  toUTCDate,
  formatDate,
} from '../utils/schengenCalculator';
import { Trip } from '../types';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { format, addDays, differenceInDays } from 'date-fns';
import { DatePickerField } from '../components/DatePickerField';

export function CalendarScreen() {
  const theme = useTheme();
  const { trips, addTrip } = useTripStore();
  const { canAddTrip } = usePremiumGate();
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Inline add-trip state
  const [addMode, setAddMode] = useState(false);
  const [newExitDate, setNewExitDate] = useState<string | null>(null);
  const [newTripName, setNewTripName] = useState('');
  const [newIsPlanned, setNewIsPlanned] = useState(false);

  const [todayStr, setTodayStr] = useState(() => {
    const now = new Date();
    return formatDate(
      new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    );
  });

  useFocusEffect(
    useCallback(() => {
      const refresh = () => {
        const now = new Date();
        const fresh = formatDate(
          new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
        );
        setTodayStr((prev) => (prev !== fresh ? fresh : prev));
      };
      refresh();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => sub.remove();
    }, [])
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    marks[todayStr] = {
      ...(marks[todayStr] || {}),
      marked: true,
      dotColor: theme.primary,
    };

    trips.forEach((trip) => {
      const entry = toUTCDate(trip.entryDate);
      const exit = toUTCDate(trip.exitDate);
      const days = differenceInDays(exit, entry) + 1;
      const baseColor = trip.isPlanned ? theme.plannedTrip : theme.tripHighlight;

      for (let i = 0; i < days; i++) {
        const d = addDays(entry, i);
        const dateStr = formatDate(d);
        marks[dateStr] = {
          ...(marks[dateStr] || {}),
          color: baseColor,
          textColor: theme.text,
          startingDay: i === 0 ? true : marks[dateStr]?.startingDay,
          endingDay: i === days - 1 ? true : marks[dateStr]?.endingDay,
        };
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.primary,
      };
    }

    return marks;
  }, [trips, todayStr, selectedDate, theme]);

  const selectedTrips = useMemo(() => {
    if (!selectedDate) return [];
    return trips.filter((t) => selectedDate >= t.entryDate && selectedDate <= t.exitDate);
  }, [selectedDate, trips]);

  const selectedDateRemaining = useMemo(() => {
    if (!selectedDate) return null;
    return getDaysRemaining(trips, toUTCDate(selectedDate));
  }, [selectedDate, trips]);

  const newTripCompliance = useMemo(() => {
    if (!selectedDate || !newExitDate) return null;
    const tempTrip: Trip = {
      id: 'temp',
      entryDate: selectedDate,
      exitDate: newExitDate,
      isPlanned: newIsPlanned,
      createdAt: '',
      updatedAt: '',
    };
    return isTripCompliant(trips, tempTrip);
  }, [selectedDate, newExitDate, trips, newIsPlanned]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    setAddMode(false);
    setNewExitDate(null);
    setNewTripName('');
    setNewIsPlanned(day.dateString > todayStr);
    setDetailVisible(true);
  }, [todayStr]);

  function handleStartAddTrip() {
    setAddMode(true);
    setNewExitDate(null);
    setNewTripName('');
  }

  async function handleSaveTrip() {
    if (!selectedDate || !newExitDate) return;
    if (newExitDate < selectedDate) {
      Alert.alert('Invalid Dates', 'Exit date must be on or after the entry date.');
      return;
    }

    if (newTripCompliance && !newTripCompliance.compliant) {
      Alert.alert(
        'Allowance Warning',
        `This trip would exceed your allowance by ${newTripCompliance.overstayDays} day(s). Max stay: ${newTripCompliance.maxDays} days. Save anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', style: 'destructive', onPress: doSave },
        ]
      );
      return;
    }
    await doSave();
  }

  async function doSave() {
    await addTrip({
      name: newTripName.trim() || undefined,
      entryDate: selectedDate!,
      exitDate: newExitDate!,
      isPlanned: newIsPlanned,
    });
    setAddMode(false);
    setNewExitDate(null);
    setNewTripName('');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Calendar
        markingType="period"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          calendarBackground: theme.surface,
          textSectionTitleColor: theme.textSecondary,
          dayTextColor: theme.text,
          todayTextColor: theme.primary,
          monthTextColor: theme.text,
          arrowColor: theme.primary,
          textDisabledColor: theme.border,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#ffffff',
        }}
        style={styles.calendar}
      />

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme.surface }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.tripHighlight }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Past</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.plannedTrip }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Planned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Today</Text>
        </View>
      </View>

      {/* Day detail modal */}
      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedDate
                  ? format(toUTCDate(selectedDate), 'EEE, dd MMM yyyy')
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => { setDetailVisible(false); setAddMode(false); }}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDateRemaining !== null && (
              <View style={[styles.remainingRow, {
                backgroundColor: (selectedDateRemaining >= 60
                  ? theme.statusGreen
                  : selectedDateRemaining >= 30
                  ? theme.statusAmber
                  : theme.statusRed) + '15',
              }]}>
                <Ionicons
                  name={selectedDateRemaining >= 0 ? 'shield-checkmark-outline' : 'warning-outline'}
                  size={16}
                  color={selectedDateRemaining >= 60
                    ? theme.statusGreen
                    : selectedDateRemaining >= 30
                    ? theme.statusAmber
                    : theme.statusRed}
                />
                <Text
                  style={[
                    styles.remainingText,
                    {
                      color: selectedDateRemaining >= 60
                        ? theme.statusGreen
                        : selectedDateRemaining >= 30
                        ? theme.statusAmber
                        : theme.statusRed,
                    },
                  ]}
                >
                  {selectedDateRemaining >= 0
                    ? `${selectedDateRemaining} days remaining`
                    : `Overstay by ${Math.abs(selectedDateRemaining)} day(s)`}
                </Text>
              </View>
            )}

            <ScrollView style={styles.tripsList}>
              {/* Existing trips on this date */}
              {selectedTrips.map((trip) => {
                const country = trip.country
                  ? SCHENGEN_COUNTRIES.find((c) => c.name === trip.country)
                  : null;
                return (
                  <View
                    key={trip.id}
                    style={[styles.tripItem, { borderBottomColor: theme.border }]}
                  >
                    {country ? (
                      <Text style={styles.tripFlag}>{country.flag}</Text>
                    ) : (
                      <View style={[styles.tripIconWrap, { backgroundColor: theme.tripHighlight }]}>
                        <Ionicons name="airplane" size={16} color={theme.primary} />
                      </View>
                    )}
                    <View style={styles.tripDetails}>
                      <Text style={[styles.tripName, { color: theme.text }]}>
                        {trip.name || trip.country || 'Schengen Trip'}
                      </Text>
                      <Text style={[styles.tripRange, { color: theme.textSecondary }]}>
                        {format(toUTCDate(trip.entryDate), 'dd MMM')} –{' '}
                        {format(toUTCDate(trip.exitDate), 'dd MMM yyyy')}
                      </Text>
                    </View>
                    {trip.isPlanned && (
                      <View style={[styles.plannedBadge, { backgroundColor: theme.accent + '15' }]}>
                        <Text style={[styles.plannedLabel, { color: theme.accent }]}>Planned</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Inline add trip */}
              {!addMode ? (
                canAddTrip ? (
                  <TouchableOpacity
                    style={[styles.addTripBtn, { borderColor: theme.border }]}
                    onPress={handleStartAddTrip}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                    <Text style={[styles.addTripBtnText, { color: theme.primary }]}>
                      Log trip from this date
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.addTripBtn, { borderColor: theme.border }]}
                    onPress={() => { setDetailVisible(false); navigation.navigate('Paywall'); }}
                  >
                    <Ionicons name="lock-closed" size={16} color={theme.accent} />
                    <Text style={[styles.addTripBtnText, { color: theme.accent }]}>
                      Upgrade to Pro to add more trips
                    </Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={[styles.addTripForm, { borderColor: theme.border }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                    Entry: {selectedDate ? format(toUTCDate(selectedDate), 'dd MMM yyyy') : ''}
                  </Text>

                  <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                    Exit date
                  </Text>
                  <DatePickerField
                    label="Exit date"
                    value={newExitDate}
                    onSelect={setNewExitDate}
                    minimumDate={selectedDate || undefined}
                  />

                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    placeholder="Trip name (optional)"
                    placeholderTextColor={theme.textSecondary}
                    value={newTripName}
                    onChangeText={setNewTripName}
                  />

                  <View style={styles.formSwitchRow}>
                    <Text style={[styles.formSwitchLabel, { color: theme.text }]}>Planned trip</Text>
                    <Switch
                      value={newIsPlanned}
                      onValueChange={setNewIsPlanned}
                      trackColor={{ true: theme.primary, false: theme.border }}
                    />
                  </View>

                  {/* Compliance */}
                  {newTripCompliance && (
                    <View style={[styles.compliancePill, {
                      backgroundColor: newTripCompliance.compliant ? theme.statusGreen + '15' : theme.statusRed + '15',
                    }]}>
                      <Ionicons
                        name={newTripCompliance.compliant ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                        size={16}
                        color={newTripCompliance.compliant ? theme.statusGreen : theme.statusRed}
                      />
                      <Text style={{
                        color: newTripCompliance.compliant ? theme.statusGreen : theme.statusRed,
                        fontSize: fontSize.xs,
                        fontWeight: '600',
                        marginLeft: 4,
                      }}>
                        {newTripCompliance.compliant
                          ? `${newTripCompliance.maxDays} day(s) — within allowance`
                          : `Exceeds by ${newTripCompliance.overstayDays} day(s)`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.formCancelBtn, { borderColor: theme.border }]}
                      onPress={() => setAddMode(false)}
                    >
                      <Text style={[styles.formCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formSaveBtn, {
                        backgroundColor: theme.primary,
                        opacity: newExitDate ? 1 : 0.4,
                      }]}
                      onPress={handleSaveTrip}
                      disabled={!newExitDate}
                    >
                      <Text style={styles.formSaveText}>Save Trip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  remainingText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tripsList: {
    maxHeight: 350,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tripFlag: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  tripIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tripDetails: {
    flex: 1,
  },
  tripName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  tripRange: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  plannedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  plannedLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  addTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  addTripBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  addTripForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  formLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  formInput: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.sm,
  },
  formSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  formSwitchLabel: {
    fontSize: fontSize.sm,
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  formCancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  formCancelText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  formSaveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  formSaveText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
