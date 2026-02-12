import { useTripStore } from '../store/tripStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { FREE_TRIP_LIMIT } from '../constants/subscription';

export function usePremiumGate() {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const trips = useTripStore((s) => s.trips);
  const tripCount = trips.length;

  return {
    canAddTrip: isPremium || tripCount < FREE_TRIP_LIMIT,
    canUseSimulator: isPremium,
    canExport: isPremium,
    canUseNotifications: isPremium,
    canUseDarkMode: isPremium,
    canViewStats: isPremium,
    tripsRemaining: isPremium ? Infinity : Math.max(0, FREE_TRIP_LIMIT - tripCount),
    tripCount,
    isPremium,
  };
}
