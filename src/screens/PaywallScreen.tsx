import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useSubscription } from '../hooks/useSubscription';
import { spacing, fontSize, borderRadius } from '../constants/theme';

const FEATURES = [
  { icon: 'infinite-outline' as const, label: 'Unlimited trips', free: false },
  { icon: 'calculator-outline' as const, label: 'What If? Planner', free: false },
  { icon: 'notifications-outline' as const, label: 'Push notifications', free: false },
  { icon: 'download-outline' as const, label: 'CSV export', free: false },
  { icon: 'moon-outline' as const, label: 'Dark mode', free: false },
  { icon: 'stats-chart-outline' as const, label: 'Trip statistics', free: false },
  { icon: 'shield-checkmark-outline' as const, label: 'Dashboard', free: true },
  { icon: 'calendar-outline' as const, label: 'Calendar view', free: true },
  { icon: 'information-circle-outline' as const, label: 'Info & Help', free: true },
];

export function PaywallScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { offerings, purchase, restore } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<'monthly' | 'annual'>('annual');

  const currentOffering = offerings?.current;
  const monthlyPkg = currentOffering?.monthly;
  const annualPkg = currentOffering?.annual;

  async function handlePurchase() {
    const pkg = selectedPkg === 'annual' ? annualPkg : monthlyPkg;
    if (!pkg) return;
    setLoading(true);
    const success = await purchase(pkg);
    setLoading(false);
    if (success) {
      navigation.goBack();
    }
  }

  async function handleRestore() {
    setLoading(true);
    const success = await restore();
    setLoading(false);
    if (success) {
      Alert.alert('Restored', 'Your Pro subscription has been restored.');
      navigation.goBack();
    } else {
      Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accent + '20' }]}>
            <Ionicons name="shield-checkmark" size={40} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Schengenigan Pro
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock the full experience
          </Text>
        </View>

        {/* Feature list */}
        <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
          {FEATURES.map((feature, i) => (
            <View
              key={feature.label}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Ionicons
                name={feature.icon}
                size={20}
                color={feature.free ? theme.textSecondary : theme.accent}
              />
              <Text style={[styles.featureLabel, { color: theme.text }]}>
                {feature.label}
              </Text>
              {feature.free ? (
                <Text style={[styles.freeLabel, { color: theme.statusGreen }]}>Free</Text>
              ) : (
                <View style={[styles.proBadge, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={[styles.proLabel, { color: theme.accent }]}>PRO</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Pricing options */}
        <View style={styles.pricingRow}>
          <TouchableOpacity
            style={[
              styles.priceOption,
              { borderColor: theme.border, backgroundColor: theme.surface },
              selectedPkg === 'monthly' && { borderColor: theme.accent, borderWidth: 2 },
            ]}
            onPress={() => setSelectedPkg('monthly')}
          >
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Monthly</Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {monthlyPkg?.product.priceString || '£2.99'}
            </Text>
            <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>/month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceOption,
              { borderColor: theme.border, backgroundColor: theme.surface },
              selectedPkg === 'annual' && { borderColor: theme.accent, borderWidth: 2 },
            ]}
            onPress={() => setSelectedPkg('annual')}
          >
            <View style={[styles.saveBadge, { backgroundColor: theme.statusGreen }]}>
              <Text style={styles.saveText}>SAVE 78%</Text>
            </View>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Annual</Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {annualPkg?.product.priceString || '£7.99'}
            </Text>
            <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>/year</Text>
          </TouchableOpacity>
        </View>

        {/* Purchase button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, { backgroundColor: theme.accent }]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              Upgrade to Pro
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={[styles.restoreBtnText, { color: theme.textSecondary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: theme.surface }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
  },
  featureCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  featureLabel: {
    flex: 1,
    fontSize: fontSize.md,
  },
  freeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  proBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  proLabel: {
    fontSize: fontSize.xs - 2,
    fontWeight: '700',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  priceOption: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  saveText: {
    color: '#ffffff',
    fontSize: fontSize.xs - 2,
    fontWeight: '700',
  },
  purchaseBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  purchaseBtnText: {
    color: '#ffffff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  restoreBtn: {
    alignItems: 'center',
    padding: spacing.md,
  },
  restoreBtnText: {
    fontSize: fontSize.sm,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
