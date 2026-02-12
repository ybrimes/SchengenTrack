import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useTripStore } from './src/store/tripStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useSubscriptionStore } from './src/store/subscriptionStore';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { rescheduleAll } from './src/utils/notifications';

export default function App() {
  const loadTrips = useTripStore((s) => s.loadTrips);
  const tripsLoaded = useTripStore((s) => s.isLoaded);
  const trips = useTripStore((s) => s.trips);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const settingsLoaded = useSettingsStore((s) => s.isLoaded);
  const settings = useSettingsStore((s) => s.settings);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const darkMode = settings.darkMode;
  const initSubscription = useSubscriptionStore((s) => s.initialize);
  const subscriptionLoaded = useSubscriptionStore((s) => s.isLoaded);
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  useEffect(() => {
    loadTrips();
    loadSettings();
    initSubscription();
  }, []);

  // Reschedule notifications whenever trips, settings, or premium status change
  useEffect(() => {
    if (!tripsLoaded || !settingsLoaded) return;
    // Only schedule if premium (notifications are a Pro feature)
    if (isPremium) {
      rescheduleAll(trips, settings);
    }
  }, [trips, settings, tripsLoaded, settingsLoaded, isPremium]);

  if (!tripsLoaded || !settingsLoaded || !subscriptionLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a5276" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
          {hasCompletedOnboarding ? <AppNavigator /> : <OnboardingScreen />}
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8fc',
  },
});
