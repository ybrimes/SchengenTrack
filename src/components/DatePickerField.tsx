import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { format, addMonths, subMonths, getDaysInMonth } from 'date-fns';

interface DatePickerFieldProps {
  label: string;
  value: string | null; // YYYY-MM-DD
  onSelect: (date: string) => void;
  minimumDate?: string;
}

export function DatePickerField({ label, value, onSelect, minimumDate }: DatePickerFieldProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedStr = value || '';

  function formatDisplayDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return format(new Date(y, m - 1, d), 'dd MMM yyyy');
  }

  function makeDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function isDayDisabled(day: number): boolean {
    if (!minimumDate) return false;
    return makeDateStr(day) < minimumDate;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: value ? theme.text : theme.textSecondary }]}>
          {value ? formatDisplayDate(value) : 'Select date...'}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.calendar, { backgroundColor: theme.surface }]}>
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
                const isSelected = dateStr === selectedStr;
                const disabled = isDayDisabled(day);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: theme.primary, borderRadius: borderRadius.full },
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      onSelect(dateStr);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        isSelected && { color: '#ffffff', fontWeight: '700' },
                        disabled && { color: theme.border },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.background }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.closeBtnText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
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
  label: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize.md,
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
  closeBtn: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
