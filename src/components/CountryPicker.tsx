import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SCHENGEN_COUNTRIES } from '../constants/countries';
import { SchengenCountry, CountryInfo } from '../types';
import { useTheme } from '../hooks/useTheme';
import { spacing, fontSize, borderRadius } from '../constants/theme';

interface CountryPickerProps {
  selected: SchengenCountry | null;
  onSelect: (country: SchengenCountry) => void;
}

export function CountryPicker({ selected, onSelect }: CountryPickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedInfo = SCHENGEN_COUNTRIES.find((c) => c.name === selected);
  const filtered = SCHENGEN_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.selectorText, { color: selected ? theme.text : theme.textSecondary }]}>
          {selectedInfo ? `${selectedInfo.flag} ${selectedInfo.name}` : 'Select country...'}
        </Text>
        <Text style={{ color: theme.textSecondary }}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Country
              </Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
                <Text style={[styles.closeButton, { color: theme.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Search countries..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { borderBottomColor: theme.border },
                    selected === item.name && { backgroundColor: theme.tripHighlight },
                  ]}
                  onPress={() => {
                    onSelect(item.name);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={[styles.countryName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  {selected === item.name && (
                    <Text style={{ color: theme.primary }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: fontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  searchInput: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  countryName: {
    fontSize: fontSize.md,
    flex: 1,
  },
});
