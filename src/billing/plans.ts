export const PLANS = {
  starter: {
    maxHomes: 1,
    maxUsers: 5,
  },
  provider: {
    maxHomes: 5,
    maxUsers: 25,
  },
} as const;

export type PlanName = keyof typeof PLANS;
