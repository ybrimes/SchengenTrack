export type SchengenCountry =
  | 'Austria'
  | 'Belgium'
  | 'Bulgaria'
  | 'Croatia'
  | 'Czechia'
  | 'Denmark'
  | 'Estonia'
  | 'Finland'
  | 'France'
  | 'Germany'
  | 'Greece'
  | 'Hungary'
  | 'Iceland'
  | 'Italy'
  | 'Latvia'
  | 'Liechtenstein'
  | 'Lithuania'
  | 'Luxembourg'
  | 'Malta'
  | 'Netherlands'
  | 'Norway'
  | 'Poland'
  | 'Portugal'
  | 'Romania'
  | 'Slovakia'
  | 'Slovenia'
  | 'Spain'
  | 'Sweden'
  | 'Switzerland';

export interface Trip {
  id: string;
  name?: string;
  country?: SchengenCountry;
  entryDate: string; // ISO date string YYYY-MM-DD
  exitDate: string; // ISO date string YYYY-MM-DD
  notes?: string;
  isPlanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  daysUsedInWindow: number;
  daysRemaining: number;
  isCompliant: boolean;
  isInSchengen: boolean;
}

export interface ComplianceResult {
  compliant: boolean;
  maxDays: number;
  overstayDays: number;
}

export type StatusColor = 'green' | 'amber' | 'red' | 'flashing-red';

export interface CountryInfo {
  name: SchengenCountry;
  flag: string;
}

export type SubscriptionTier = 'free' | 'pro';

export interface PremiumGateResult {
  canAddTrip: boolean;
  canUseSimulator: boolean;
  canExport: boolean;
  canUseNotifications: boolean;
  canUseDarkMode: boolean;
  canViewStats: boolean;
  tripsRemaining: number;
  tripCount: number;
  isPremium: boolean;
}

export type RootStackParamList = {
  Main: undefined;
  Paywall: undefined;
};
