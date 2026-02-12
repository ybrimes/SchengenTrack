import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TripListScreen } from '../screens/TripListScreen';
import { AddTripScreen } from '../screens/AddTripScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SimulatorScreen } from '../screens/SimulatorScreen';
import { InfoScreen } from '../screens/InfoScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();
const TripStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const TAB_ICONS: Record<string, { focused: string; default: string }> = {
  Home: { focused: 'shield-checkmark', default: 'shield-checkmark-outline' },
  Trips: { focused: 'briefcase', default: 'briefcase-outline' },
  Calendar: { focused: 'calendar', default: 'calendar-outline' },
  Planner: { focused: 'calculator', default: 'calculator-outline' },
  More: { focused: 'ellipsis-horizontal-circle', default: 'ellipsis-horizontal-circle-outline' },
};

function TripStackNavigator() {
  const theme = useTheme();
  return (
    <TripStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <TripStack.Screen
        name="TripList"
        component={TripListScreen}
        options={{ title: 'My Trips' }}
      />
      <TripStack.Screen
        name="AddTrip"
        component={AddTripScreen}
        options={({ route }: any) => ({
          title: route.params?.editTripId ? 'Edit Trip' : 'Add Trip',
        })}
      />
    </TripStack.Navigator>
  );
}

function MoreStackNavigator() {
  const theme = useTheme();
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <MoreStack.Screen
        name="InfoMain"
        component={InfoScreen}
        options={{ title: 'Info & Help' }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <MoreStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <MoreStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Terms of Service' }}
      />
    </MoreStack.Navigator>
  );
}

function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          const iconSet = TAB_ICONS[route.name];
          const iconName = focused ? iconSet.focused : iconSet.default;
          return <Ionicons name={iconName as any} size={22} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Trips"
        component={TripStackNavigator}
        options={{ headerShown: false, title: 'Trips' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="Planner"
        component={SimulatorScreen}
        options={{ title: 'Planner' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{ headerShown: false, title: 'More' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={TabNavigator} />
      <RootStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}
