import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { format, addMonths, subMonths, getDaysInMonth } from 'date-fns';

interface DateRangePickerProps {
  entryDate: string | null;
  exitDate: string | null;
  onSelect: (entryDate: string, exitDate: string) => void;
}

type Phase = 'start' | 'end';

export function DateRangePicker({ entryDate, exitDate, onSelect }: DateRangePickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('start');
  const [tempStart, setTempStart] = useState<string | null>(entryDate);
  const [tempEnd, setTempEnd] = useState<string | null>(exitDate);
  const [viewDate, setViewDate] = useState(() => {
    if (entryDate) {
      const [y, m] = entryDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function makeDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function formatDisplayDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return format(new Date(y, m - 1, d), 'dd MMM yyyy');
  }

  function isInRange(dateStr: string): boolean {
    if (!tempStart || !tempEnd) return false;
    return dateStr >= tempStart && dateStr <= tempEnd;
  }

  function isDayDisabled(day: number): boolean {
    if (phase === 'end' && tempStart) {
      return makeDateStr(day) < tempStart;
    }
    return false;
  }

  function handleOpen() {
    setTempStart(entryDate);
    setTempEnd(exitDate);
    setPhase('start');
    if (entryDate) {
      const [y, m] = entryDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
    setVisible(true);
  }

  function handleDayPress(day: number) {
    const dateStr = makeDateStr(day);

    if (phase === 'start') {
      setTempStart(dateStr);
      setTempEnd(null);
      setPhase('end');
    } else {
      if (dateStr < tempStart!) {
        // User tapped before start — reset start
        setTempStart(dateStr);
        setTempEnd(null);
        return;
      }
      setTempEnd(dateStr);
      onSelect(tempStart!, dateStr);
      setVisible(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleOpen}
      >
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Entry</Text>
            <Text style={[styles.dateValue, { color: entryDate ? theme.text : theme.textSecondary }]}>
              {entryDate ? formatDisplayDate(entryDate) : 'Select...'}
            </Text>
          </View>
          <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
          <View style={styles.dateCol}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Exit</Text>
            <Text style={[styles.dateValue, { color: exitDate ? theme.text : theme.textSecondary }]}>
              {exitDate ? formatDisplayDate(exitDate) : 'Select...'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.calendar, { backgroundColor: theme.surface }]}>
            {/* Phase indicator */}
            <View style={[styles.phaseBar, { backgroundColor: theme.background }]}>
              <View style={[styles.phaseItem, phase === 'start' && { backgroundColor: theme.primary }]}>
                <Text style={[styles.phaseText, { color: phase === 'start' ? '#ffffff' : theme.textSecondary }]}>
                  {tempStart ? formatDisplayDate(tempStart) : 'Entry date'}
                </Text>
              </View>
              <View style={[styles.phaseItem, phase === 'end' && { backgroundColor: theme.primary }]}>
                <Text style={[styles.phaseText, { color: phase === 'end' ? '#ffffff' : theme.textSecondary }]}>
                  {tempEnd ? formatDisplayDate(tempEnd) : 'Exit date'}
                </Text>
              </View>
            </View>

            <Text style={[styles.phaseHint, { color: theme.textSecondary }]}>
              {phase === 'start' ? 'Select your entry date' : 'Now select your exit date'}
            </Text>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => setViewDate(subMonths(viewDate, 1))}>
                <Text style={[styles.navArrow, { color: theme.primary }]}>◀</Text>
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: theme.text }]}>
                {format(viewDate, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={() => setViewDate(addMonths(viewDate, 1))}>
                <Text style={[styles.navArrow, { color: theme.primary }]}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Day names */}
            <View style={styles.dayNamesRow}>
              {dayNames.map((name) => (
                <Text key={name} style={[styles.dayName, { color: theme.textSecondary }]}>
                  {name}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const dateStr = makeDateStr(day);
                const isStart = dateStr === tempStart;
                const isEnd = dateStr === tempEnd;
                const inRange = isInRange(dateStr);
                const disabled = isDayDisabled(day);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      inRange && !isStart && !isEnd && { backgroundColor: theme.tripHighlight },
                      isStart && { backgroundColor: theme.primary, borderTopLeftRadius: borderRadius.full, borderBottomLeftRadius: borderRadius.full },
                      isEnd && { backgroundColor: theme.primary, borderTopRightRadius: borderRadius.full, borderBottomRightRadius: borderRadius.full },
                    ]}
                    disabled={disabled}
                    onPress={() => handleDayPress(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        (isStart || isEnd) && { color: '#ffffff', fontWeight: '700' },
                        disabled && { color: theme.border },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.background }]}
                onPress={() => setVisible(false)}
              >
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              {phase === 'end' && tempStart && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => { setPhase('start'); setTempStart(null); setTempEnd(null); }}
                >
                  <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  arrow: {
    fontSize: fontSize.lg,
    marginHorizontal: spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  calendar: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  phaseBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  phaseItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  phaseText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  phaseHint: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navArrow: {
    fontSize: fontSize.lg,
    padding: spacing.sm,
  },
  monthTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: fontSize.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  resetBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  resetText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
