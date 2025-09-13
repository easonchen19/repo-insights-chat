export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    price_id: 'price_1S6wlJFz7f8zDT6L8G4QCGHk',
    features: {
      projects: 1,
      prompts: 'Prebuilt only',
      customPrompts: false,
      premiumPrompts: 0
    }
  },
  pro: {
    name: 'Pro',
    price: 9,
    price_id: 'price_1S6wohFz7f8zDT6Lr9mbr1If',
    features: {
      projects: 3,
      prompts: 'Custom + Prebuilt',
      customPrompts: true,
      premiumPrompts: 100
    }
  },
  advanced: {
    name: 'Advanced',
    price: 29,
    price_id: 'price_1S6wrfFz7f8zDT6LKbIuSMQc',
    features: {
      projects: 10,
      prompts: 'All features',
      customPrompts: true,
      premiumPrompts: 350
    }
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export interface SubscriptionStatus {
  subscribed: boolean;
  tier: SubscriptionTier;
  product_id: string | null;
  subscription_end: string | null;
}