export const FREE_MONTHLY_GENERATIONS = 3;

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export type EntitlementStatus = {
  isPremium: boolean;
  canExportPdf: boolean;
  canShare: boolean;
  canGenerate: boolean;
  canSave: boolean;
  canRegeneratePage: boolean;
  generationsRemaining: number;
};

export const resolveEntitlements = ({
  generationCount,
  subscriptionStatus,
  isLoggedIn,
}: {
  generationCount: number;
  subscriptionStatus?: string | null;
  isLoggedIn: boolean;
}): EntitlementStatus => {
  const isPremium = subscriptionStatus
    ? ACTIVE_STATUSES.has(subscriptionStatus)
    : false;
  const generationsRemaining = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_MONTHLY_GENERATIONS - generationCount);

  return {
    isPremium,
    canExportPdf: isPremium,
    canShare: isPremium,
    canGenerate: isPremium || generationCount < FREE_MONTHLY_GENERATIONS,
    canSave: isLoggedIn,
    canRegeneratePage: isPremium,
    generationsRemaining,
  };
};
