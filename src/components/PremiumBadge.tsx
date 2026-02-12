import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontSize, spacing, borderRadius } from '../constants/theme';

interface PremiumBadgeProps {
  onPress?: () => void;
  size?: 'small' | 'medium';
  label?: string;
}

export function PremiumBadge({ onPress, size = 'small', label = 'PRO' }: PremiumBadgeProps) {
  const theme = useTheme();

  const content = (
    <View style={[
      styles.badge,
      size === 'medium' && styles.badgeMedium,
      { backgroundColor: theme.accent + '20' },
    ]}>
      <Ionicons
        name="lock-closed"
        size={size === 'small' ? 10 : 12}
        color={theme.accent}
      />
      <Text style={[
        styles.label,
        size === 'medium' && styles.labelMedium,
        { color: theme.accent },
      ]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  badgeMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs - 2,
    fontWeight: '700',
  },
  labelMedium: {
    fontSize: fontSize.xs,
  },
});
