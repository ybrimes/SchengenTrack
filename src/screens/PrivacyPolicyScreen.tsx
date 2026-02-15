import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';

export function PrivacyPolicyScreen() {
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
        SchengenTrack ("the App") is committed to protecting your privacy. This
        Privacy Policy explains how the App handles your information.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Data Storage
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        All trip data, settings, and preferences are stored locally on your
        device using on-device storage. No trip data is transmitted to, stored
        on, or processed by any external server. The App does not have a
        backend server and does not collect, upload, or share your trip data.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        In-App Purchases
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App offers optional premium subscriptions processed through Apple
        App Store or Google Play Store. Purchase transactions are handled
        entirely by Apple or Google. We use RevenueCat to manage subscription
        status. RevenueCat receives an anonymous app user ID to verify your
        subscription entitlement. No personal information (name, email, payment
        details) is shared with RevenueCat or any other third party by the App.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Notifications
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App may send local push notifications (trip reminders and weekly
        summaries) if you enable this feature. These notifications are
        generated and scheduled entirely on your device. No notification data
        is sent to any server.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Analytics & Tracking
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App does not include any analytics SDKs, tracking pixels,
        advertising identifiers, or third-party analytics services. The App
        does not track your usage, location, or behaviour.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Data You Provide
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The only data the App processes is what you manually enter: trip names,
        countries, dates, and notes. This data remains on your device. If you
        use the CSV export feature, you choose how and where to share that
        file.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Data Deletion
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        You can delete all your data at any time by using the "Reset All Data"
        option in Settings. Uninstalling the App also removes all stored data
        from your device.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Children's Privacy
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The App is not directed at children under 13 and does not knowingly
        collect information from children.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Changes to This Policy
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        We may update this Privacy Policy from time to time. Any changes will
        be reflected in the App with an updated "Last updated" date.
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>
        Contact
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        If you have questions about this Privacy Policy, please contact us at
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
