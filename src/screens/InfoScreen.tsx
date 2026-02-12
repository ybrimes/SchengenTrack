import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { SCHENGEN_COUNTRIES } from '../constants/countries';
import { spacing, fontSize, borderRadius } from '../constants/theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does the 90/180-day rule work?',
    answer:
      'As a UK citizen, you can stay in the Schengen Area for up to 90 days within any rolling 180-day period. The 180-day window is not fixed — it rolls backwards from any given date. For any date, look back 180 days and count how many of those days you were in the Schengen Area. That count must not exceed 90.',
  },
  {
    question: 'Do both the entry and exit days count?',
    answer:
      'Yes. The day you enter the Schengen Area and the day you leave both count as full days of presence. For example, entering on June 1st and leaving on June 3rd uses 3 days of your allowance.',
  },
  {
    question: 'Does Cyprus count toward my Schengen days?',
    answer:
      'No. Cyprus is not part of the Schengen Area. It has its own separate 90-day visa-free limit for UK citizens that does not count toward your Schengen allowance.',
  },
  {
    question: 'What about Ireland?',
    answer:
      'Ireland is not in the Schengen Area. UK citizens have unrestricted access to Ireland through the Common Travel Area (CTA) agreement. Time spent in Ireland does not count toward your Schengen days.',
  },
  {
    question: 'Do transit days count?',
    answer:
      'If you pass through passport control and officially enter the Schengen Area (even for a layover), that day counts. If you remain in the international transit zone of an airport without passing through immigration, it does not count.',
  },
  {
    question: 'What happens if I overstay?',
    answer:
      'Overstaying can result in fines, a ban on entering the Schengen Area (typically for a period of 1-5 years), detention, or deportation. The specific penalties vary by country. It may also affect future visa applications.',
  },
  {
    question: 'What is ETIAS?',
    answer:
      'ETIAS (European Travel Information and Authorisation System) is expected to launch in 2026. UK travellers will need to apply online and pay a fee of \u20AC7. Once approved, the authorisation is valid for 3 years. ETIAS does not change the 90/180-day rule — it is simply an additional travel authorisation requirement.',
  },
  {
    question: 'Does moving between Schengen countries reset my days?',
    answer:
      'No. Moving from one Schengen country to another (e.g., France to Germany) does not reset your day count. All Schengen countries share the same 90/180-day allowance.',
  },
];

export function InfoScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showCountries, setShowCountries] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Rule explanation */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          The 90/180-Day Rule
        </Text>
        <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
          Since Brexit, UK citizens are treated as third-country nationals when
          visiting the Schengen Area. You can stay for a maximum of 90 days
          within any rolling 180-day period without a visa.
        </Text>
        <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
          The 180-day window is not a fixed calendar period — it rolls
          backwards from any given date. On any day, look back 180 days and
          count the days you spent in the Schengen Area. That total must not
          exceed 90.
        </Text>
        <Text style={[styles.example, { color: theme.primary }]}>
          Example: If you spend 30 days in Spain in January, 30 days in France
          in March, and 30 days in Italy in May, you have used all 90 days and
          cannot re-enter the Schengen Area until some of those days fall
          outside the 180-day window.
        </Text>
      </View>

      {/* Schengen countries */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => setShowCountries(!showCountries)}
      >
        <View style={styles.expandHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Schengen Area Countries (29)
          </Text>
          <Text style={{ color: theme.primary }}>
            {showCountries ? '▲' : '▼'}
          </Text>
        </View>
        {showCountries && (
          <View style={styles.countryGrid}>
            {SCHENGEN_COUNTRIES.map((c) => (
              <View key={c.name} style={styles.countryItem}>
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={[styles.countryName, { color: theme.text }]}>
                  {c.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Non-Schengen notes */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Non-Schengen Notes
        </Text>
        <View style={styles.noteItem}>
          <Text style={[styles.noteCountry, { color: theme.text }]}>
            Ireland
          </Text>
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            Not in Schengen. UK citizens have unrestricted access via the
            Common Travel Area.
          </Text>
        </View>
        <View style={styles.noteItem}>
          <Text style={[styles.noteCountry, { color: theme.text }]}>
            Cyprus
          </Text>
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            Not in Schengen. Has its own 90-day visa-free limit — does NOT
            count toward Schengen days.
          </Text>
        </View>
      </View>

      {/* FAQ */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Frequently Asked Questions
      </Text>
      {FAQ_ITEMS.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.faqItem, { backgroundColor: theme.surface }]}
          onPress={() =>
            setExpandedFAQ(expandedFAQ === index ? null : index)
          }
        >
          <View style={styles.faqHeader}>
            <Text style={[styles.faqQuestion, { color: theme.text }]}>
              {item.question}
            </Text>
            <Text style={{ color: theme.primary }}>
              {expandedFAQ === index ? '−' : '+'}
            </Text>
          </View>
          {expandedFAQ === index && (
            <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              {item.answer}
            </Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Official calculator link */}
      <TouchableOpacity
        style={[styles.linkCard, { backgroundColor: theme.primary }]}
        onPress={() =>
          Linking.openURL(
            'https://ec.europa.eu/assets/home/visa-calculator/calculator.htm'
          )
        }
      >
        <Text style={styles.linkText}>
          Open Official EU Short-Stay Calculator
        </Text>
      </TouchableOpacity>

      {/* Legal */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Legal
      </Text>
      <View style={[styles.legalCard, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.legalRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[styles.settingsLinkText, { color: theme.text }]}>
            Privacy Policy
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => navigation.navigate('Terms')}
        >
          <Text style={[styles.settingsLinkText, { color: theme.text }]}>
            Terms of Service
          </Text>
          <Text style={{ color: theme.textSecondary }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Settings link */}
      <TouchableOpacity
        style={[styles.settingsLink, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={[styles.settingsLinkText, { color: theme.text }]}>
          Settings
        </Text>
        <Text style={{ color: theme.textSecondary }}>▶</Text>
      </TouchableOpacity>
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
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  example: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 4,
  },
  countryFlag: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  countryName: {
    fontSize: fontSize.sm,
  },
  noteItem: {
    marginBottom: spacing.md,
  },
  noteCountry: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  faqItem: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  faqQuestion: {
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  linkCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  settingsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  settingsLinkText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  legalCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
