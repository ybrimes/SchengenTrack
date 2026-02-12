import { create } from 'zustand';
import { Platform } from 'react-native';
import {
  REVENUECAT_API_KEY_APPLE,
  REVENUECAT_API_KEY_GOOGLE,
  ENTITLEMENT_ID,
} from '../constants/subscription';

// Lazy-load RevenueCat to avoid crash when native module isn't available
// (Expo Go, web, or dev builds without the native module linked)
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Native module not available — will run in free-tier-only mode
}

interface SubscriptionStore {
  isPremium: boolean;
  offerings: any | null;
  customerInfo: any | null;
  isLoaded: boolean;

  initialize: () => Promise<void>;
  purchase: (pkg: any) => Promise<boolean>;
  restore: () => Promise<boolean>;
  checkEntitlement: (info: any) => boolean;
  toggleDevPremium: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  isPremium: false,
  offerings: null,
  customerInfo: null,
  isLoaded: false,

  initialize: async () => {
    if (!Purchases) {
      // No native module — skip RevenueCat, run as free tier
      set({ isLoaded: true });
      return;
    }

    try {
      const apiKey =
        Platform.OS === 'ios'
          ? REVENUECAT_API_KEY_APPLE
          : REVENUECAT_API_KEY_GOOGLE;

      Purchases.configure({ apiKey });

      Purchases.addCustomerInfoUpdateListener((info: any) => {
        const isPremium = get().checkEntitlement(info);
        set({ customerInfo: info, isPremium });
      });

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const isPremium = get().checkEntitlement(customerInfo);

      set({
        customerInfo,
        offerings,
        isPremium,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  purchase: async (pkg) => {
    if (!Purchases) return false;
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = get().checkEntitlement(customerInfo);
      set({ customerInfo, isPremium });
      return isPremium;
    } catch {
      return false;
    }
  },

  restore: async () => {
    if (!Purchases) return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = get().checkEntitlement(customerInfo);
      set({ customerInfo, isPremium });
      return isPremium;
    } catch {
      return false;
    }
  },

  checkEntitlement: (info) => {
    if (!info?.entitlements?.active) return false;
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  },

  // Dev-only: toggle premium for testing both tiers
  toggleDevPremium: () => {
    if (__DEV__) {
      set({ isPremium: !get().isPremium });
    }
  },
}));
