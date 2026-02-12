import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';
import { useTheme } from '../hooks/useTheme';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { PremiumBadge } from '../components/PremiumBadge';
import {
  getTripDuration,
  getDaysRemaining,
  toUTCDate,
  formatDate,
} from '../utils/schengenCalculator';
import { SCHENGEN_COUNTRIES } from '../constants/countries';
import { Trip } from '../types';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { format } from 'date-fns';
import { FREE_TRIP_LIMIT } from '../constants/subscription';
import { hapticSuccess, hapticWarning } from '../utils/haptics';

type FilterType = 'all' | 'past' | 'planned';

export function TripListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const trips = useTripStore((s) => s.trips);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const { canViewStats, canAddTrip, isPremium, tripsRemaining } = usePremiumGate();
  const [filter, setFilter] = useState<FilterType>('all');

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

  const filteredTrips = useMemo(() => {
    let list = [...trips];
    if (filter === 'past') {
      list = list.filter((t) => t.exitDate <= todayStr && !t.isPlanned);
    } else if (filter === 'planned') {
      list = list.filter((t) => t.isPlanned || t.entryDate > todayStr);
    }
    return list.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [trips, filter, todayStr]);

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear().toString();
    const thisYearTrips = trips.filter((t) => t.entryDate.startsWith(thisYear));
    const countryCounts: Record<string, number> = {};
    let totalDays = 0;
    trips.forEach((t) => {
      const dur = getTripDuration(t);
      totalDays += dur;
      if (t.country) {
        countryCounts[t.country] = (countryCounts[t.country] || 0) + 1;
      }
    });
    const mostVisited = Object.entries(countryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return {
      tripsThisYear: thisYearTrips.length,
      totalDays,
      mostVisited: mostVisited ? mostVisited[0] : null,
    };
  }, [trips]);

  function handleDelete(trip: Trip) {
    hapticWarning();
    const label = trip.name || trip.country || 'this trip';
    Alert.alert('Delete Trip', `Are you sure you want to delete ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTrip(trip.id);
          hapticSuccess();
        },
      },
    ]);
  }

  function renderTrip({ item }: { item: Trip }) {
    const country = item.country ? SCHENGEN_COUNTRIES.find((c) => c.name === item.country) : null;
    const duration = getTripDuration(item);
    const entryFormatted = format(toUTCDate(item.entryDate), 'dd MMM yyyy');
    const exitFormatted = format(toUTCDate(item.exitDate), 'dd MMM yyyy');

    return (
      <TouchableOpacity
        style={[
          styles.tripCard,
          { backgroundColor: theme.surface },
          item.isPlanned && { borderLeftColor: theme.accent, borderLeftWidth: 3 },
        ]}
        onPress={() =>
          navigation.navigate('AddTrip', { editTripId: item.id })
        }
      >
        <View style={styles.tripHeader}>
          {country ? (
            <Text style={styles.tripFlag}>{country.flag}</Text>
          ) : (
            <View style={[styles.tripIconWrap, { backgroundColor: theme.tripHighlight }]}>
              <Ionicons name="airplane" size={18} color={theme.primary} />
            </View>
          )}
          <View style={styles.tripInfo}>
            <Text style={[styles.tripCountry, { color: theme.text }]}>
              {item.name || item.country || 'Schengen Trip'}
            </Text>
            <Text style={[styles.tripDates, { color: theme.textSecondary }]}>
              {entryFormatted} - {exitFormatted}
            </Text>
          </View>
          {item.isPlanned && (
            <View style={[styles.plannedBadge, { backgroundColor: theme.accent + '20' }]}>
              <Text style={[styles.plannedText, { color: theme.accent }]}>Planned</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.statusRed} />
          </TouchableOpacity>
        </View>
        <View style={styles.tripMeta}>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {duration} day{duration !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Stats summary */}
      {trips.length > 0 && (
        canViewStats ? (
          <View style={[styles.statsBar, { backgroundColor: theme.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {stats.tripsThisYear}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                This year
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {stats.totalDays}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total days
              </Text>
            </View>
            {stats.mostVisited && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {SCHENGEN_COUNTRIES.find((c) => c.name === stats.mostVisited)?.flag}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Most visited
                </Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.statsBar, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('Paywall')}
          >
            <View style={styles.statsLockedRow}>
              <Ionicons name="stats-chart-outline" size={16} color={theme.accent} />
              <Text style={[styles.statsLockedText, { color: theme.textSecondary }]}>
                Trip statistics
              </Text>
              <PremiumBadge />
            </View>
          </TouchableOpacity>
        )
      )}

      {/* Trip count indicator */}
      {!isPremium && trips.length > 0 && (
        <View style={[styles.tripCountRow, { backgroundColor: theme.surface }]}>
          <Text style={[styles.tripCountText, { color: theme.textSecondary }]}>
            {tripsRemaining > 0
              ? `${trips.length}/${FREE_TRIP_LIMIT} free trips`
              : `${FREE_TRIP_LIMIT}/${FREE_TRIP_LIMIT} free trips used`}
          </Text>
        </View>
      )}
      {isPremium && trips.length > 0 && (
        <View style={[styles.tripCountRow, { backgroundColor: theme.surface }]}>
          <Text style={[styles.tripCountText, { color: theme.textSecondary }]}>
            {trips.length} trips — Unlimited
          </Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'past', 'planned'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              { borderColor: theme.border },
              filter === f && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.textSecondary },
                filter === f && { color: '#ffffff' },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No trips found
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {filter === 'all'
                ? 'Add your first trip to start tracking.'
                : `No ${filter} trips to show.`}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          if (canAddTrip) {
            navigation.navigate('AddTrip');
          } else {
            navigation.navigate('Paywall');
          }
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statsLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  statsLockedText: {
    fontSize: fontSize.sm,
  },
  tripCountRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  tripCountText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  tripCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripFlag: {
    fontSize: fontSize.xxl,
    marginRight: spacing.md,
  },
  tripIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripCountry: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  tripDates: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  plannedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  plannedText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  tripMeta: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  metaText: {
    fontSize: fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
