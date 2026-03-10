export const TRIAL_DAYS = 3;
export const TRIAL_DAILY_LIMIT = 5;
export const TRIAL_TOTAL_LIMIT = TRIAL_DAYS * TRIAL_DAILY_LIMIT;

export type TrialUsage = {
  isTrial: boolean;
  trialEndsAt: Date | null;
  expired: boolean;
  usedToday: number;
  usedTotal: number;
  remainingToday: number;
  remainingTotal: number;
};

export function computeTrialUsage(
  trialStart: Date,
  sessions: Array<{ started_at: string }>,
  now = new Date(),
): TrialUsage {
  const trialEndsAt = new Date(trialStart);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const usedTotal = sessions.length;
  const usedToday = sessions.filter((s) => {
    const startedAt = new Date(s.started_at);
    return startedAt >= startOfToday;
  }).length;

  const remainingTotal = Math.max(0, TRIAL_TOTAL_LIMIT - usedTotal);
  const remainingToday = Math.max(0, TRIAL_DAILY_LIMIT - usedToday);
  const expired = now > trialEndsAt;

  return {
    isTrial: true,
    trialEndsAt,
    expired,
    usedToday,
    usedTotal,
    remainingToday: expired ? 0 : remainingToday,
    remainingTotal: expired ? 0 : remainingTotal,
  };
}
