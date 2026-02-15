import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';

export function TermsScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.updated, { color: theme.textSecondary }]}>
        Last updated: February 2026
      </Text>

      <Text style={[styles.body, { color: theme.textSecondary }]}>
        By using SchengenTrack ("the App"), you agree to these Terms of
        Service. If you do not agree, please do not use the App.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Purpose of the App
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App is a personal travel tracking tool designed to help you
        estimate your usage of the Schengen Area 90/180-day rule. It is
        provided for informational and planning purposes only.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        No Legal Advice
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App does not provide legal, immigration, or travel advice. The
        calculations and information provided are estimates and may not reflect
        the exact interpretation applied by border authorities. Immigration
        rules can change without notice. You are solely responsible for
        verifying your travel eligibility with official sources before
        travelling.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        No Liability
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App is provided "as is" without warranty of any kind. To the
        maximum extent permitted by law, the developer shall not be liable for
        any damages, losses, fines, deportation, travel disruption, or other
        consequences arising from your use of or reliance on the App. You use
        the App at your own risk.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Accuracy of Data
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The accuracy of the App's calculations depends entirely on the data
        you enter. The App cannot verify whether your trip dates are correct or
        complete. Incorrect or missing trip entries will produce inaccurate
        results.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Subscriptions
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App offers optional premium subscriptions ("SchengenTrack Pro")
        billed monthly or annually. Subscriptions are processed and managed by
        Apple App Store or Google Play Store. Payment is charged to your store
        account at confirmation of purchase. Subscriptions automatically renew
        unless cancelled at least 24 hours before the end of the current
        billing period. You can manage or cancel your subscription in your
        device's store settings.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Free Tier
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The free version of the App allows you to track a limited number of
        trips. Additional features are available with a premium subscription.
        The developer reserves the right to change the features included in
        each tier.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Intellectual Property
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        All content, design, and code in the App are the intellectual property
        of the developer. You may not copy, modify, distribute, or reverse
        engineer the App.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Termination
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        We reserve the right to modify, suspend, or discontinue the App at any
        time. You may stop using the App at any time by uninstalling it.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Changes to These Terms
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        We may update these Terms from time to time. Continued use of the App
        after changes constitutes acceptance of the updated Terms.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Governing Law
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        These Terms are governed by the laws of England and Wales.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Contact
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        If you have questions about these Terms, please contact us at
        yannick.huber@tutamail.com.
      </Text>
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
  updated: {
    fontSize: fontSize.xs,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
