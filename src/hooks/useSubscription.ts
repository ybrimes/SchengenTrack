import { useSubscriptionStore } from '../store/subscriptionStore';

export function useSubscription() {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const offerings = useSubscriptionStore((s) => s.offerings);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const toggleDevPremium = useSubscriptionStore((s) => s.toggleDevPremium);

  return { isPremium, offerings, purchase, restore, toggleDevPremium };
}
