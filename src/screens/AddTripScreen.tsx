import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { CountryPicker } from '../components/CountryPicker';
import { DateRangePicker } from '../components/DateRangePicker';
import { isTripCompliant } from '../utils/schengenCalculator';
import { SchengenCountry, Trip } from '../types';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { FREE_TRIP_LIMIT } from '../constants/subscription';

type RouteParams = {
  AddTrip: { editTripId?: string };
};

export function AddTripScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddTrip'>>();
  const editTripId = route.params?.editTripId;

  const { trips, addTrip, updateTrip, deleteTrip, getTrip } = useTripStore();
  const { canAddTrip, tripsRemaining, isPremium } = usePremiumGate();
  const editingTrip = editTripId ? getTrip(editTripId) : undefined;

  const [name, setName] = useState(editingTrip?.name || '');
  const [country, setCountry] = useState<SchengenCountry | null>(
    editingTrip?.country || null
  );
  const [showCountry, setShowCountry] = useState(!!editingTrip?.country);
  const [entryDate, setEntryDate] = useState<string | null>(
    editingTrip?.entryDate || null
  );
  const [exitDate, setExitDate] = useState<string | null>(
    editingTrip?.exitDate || null
  );
  const [notes, setNotes] = useState(editingTrip?.notes || '');
  const [isPlanned, setIsPlanned] = useState(editingTrip?.isPlanned ?? false);

  const complianceCheck = useMemo(() => {
    if (!entryDate || !exitDate) return null;
    const newTrip: Trip = {
      id: editTripId || 'new',
      country: country || undefined,
      entryDate,
      exitDate,
      isPlanned,
      createdAt: '',
      updatedAt: '',
    };
    const existingTrips = editTripId
      ? trips.filter((t) => t.id !== editTripId)
      : trips;
    return isTripCompliant(existingTrips, newTrip);
  }, [country, entryDate, exitDate, trips, editTripId, isPlanned]);

  function handleDateSelect(entry: string, exit: string) {
    setEntryDate(entry);
    setExitDate(exit);
  }

  async function handleSave() {
    if (!entryDate) {
      Alert.alert('Missing Field', 'Please select your travel dates.');
      return;
    }
    if (!exitDate) {
      Alert.alert('Missing Field', 'Please select your exit date.');
      return;
    }
    if (exitDate < entryDate) {
      Alert.alert('Invalid Dates', 'Exit date must be on or after the entry date.');
      return;
    }

    // Premium gate: block new trips (not edits) when at limit
    if (!editTripId && !canAddTrip) {
      navigation.navigate('Paywall');
      return;
    }

    if (complianceCheck && !complianceCheck.compliant) {
      Alert.alert(
        'Allowance Warning',
        `This trip would exceed your 90-day allowance by ${complianceCheck.overstayDays} day(s). You can stay a maximum of ${complianceCheck.maxDays} days. Do you still want to save this trip?`,
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
    const tripData = {
      name: name.trim() || undefined,
      country: country || undefined,
      entryDate: entryDate!,
      exitDate: exitDate!,
      notes: notes.trim() || undefined,
      isPlanned,
    };

    if (editTripId) {
      await updateTrip(editTripId, tripData);
    } else {
      await addTrip(tripData);
    }
    navigation.goBack();
  }

  function handleDelete() {
    if (!editTripId) return;
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(editTripId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Dates — primary field */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Travel Dates
      </Text>
      <DateRangePicker
        entryDate={entryDate}
        exitDate={exitDate}
        onSelect={handleDateSelect}
      />

      {/* Planned toggle */}
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: theme.text }]}>
          Planned / Future Trip
        </Text>
        <Switch
          value={isPlanned}
          onValueChange={setIsPlanned}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>

      {/* Compliance feedback — show right after dates */}
      {complianceCheck && (
        <View
          style={[
            styles.complianceCard,
            {
              backgroundColor: complianceCheck.compliant
                ? theme.statusGreen + '15'
                : theme.statusRed + '15',
              borderColor: complianceCheck.compliant
                ? theme.statusGreen
                : theme.statusRed,
            },
          ]}
        >
          <Text
            style={[
              styles.complianceText,
              {
                color: complianceCheck.compliant
                  ? theme.statusGreen
                  : theme.statusRed,
              },
            ]}
          >
            {complianceCheck.compliant
              ? `This trip is within your allowance. You'll use ${complianceCheck.maxDays} day(s).`
              : `Warning: This trip would exceed your allowance by ${complianceCheck.overstayDays} day(s). Maximum stay: ${complianceCheck.maxDays} days.`}
          </Text>
        </View>
      )}

      {/* Trip name — optional */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Trip Name (optional)
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        placeholder="e.g., Summer holiday"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
      />

      {/* Country — optional, collapsed by default */}
      {!showCountry ? (
        <TouchableOpacity
          style={styles.optionalToggle}
          onPress={() => setShowCountry(true)}
        >
          <Text style={[styles.optionalToggleText, { color: theme.primary }]}>
            + Add country (optional, for your records)
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Country (optional)
          </Text>
          <CountryPicker selected={country} onSelect={setCountry} />
        </>
      )}

      {/* Notes — optional */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Notes (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.notesInput,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
        ]}
        placeholder="Any notes about this trip..."
        placeholderTextColor={theme.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Trip limit counter for free users */}
      {!isPremium && !editTripId && (
        <View style={[styles.tripLimitRow, { backgroundColor: theme.surface }]}>
          <Text style={[styles.tripLimitText, { color: theme.textSecondary }]}>
            {tripsRemaining > 0
              ? `${trips.length} of ${FREE_TRIP_LIMIT} free trips used`
              : `${FREE_TRIP_LIMIT}/${FREE_TRIP_LIMIT} free trips used — upgrade to add more`}
          </Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {editTripId ? 'Update Trip' : 'Save Trip'}
        </Text>
      </TouchableOpacity>

      {/* Delete button (edit mode only) */}
      {editTripId && (
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.statusRed }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteButtonText, { color: theme.statusRed }]}>
            Delete Trip
          </Text>
        </TouchableOpacity>
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchLabel: {
    fontSize: fontSize.md,
  },
  optionalToggle: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  optionalToggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  complianceCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  complianceText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tripLimitRow: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  tripLimitText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  saveButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  deleteButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
