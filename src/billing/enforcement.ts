import { PLANS, type PlanName } from "./plans";
import { hasEntitlement } from "@/lib/entitlements";

type Billing = {
  status: string | null;
  plan: string | null;
};

const getLimits = (plan: string | null) => {
  const p = (plan as PlanName) || "starter";
  return PLANS[p] || PLANS.starter;
};

export const isBillingActive = (billing: Billing) => billing.status === "active" || hasEntitlement({ action: "bypass_billing", ...billing });
export const isReadOnly = (billing: Billing) => !isBillingActive(billing);

export const canCreateHome = ({ billing, currentHomeCount }: { billing: Billing; currentHomeCount: number }) => {
  if (!isBillingActive(billing)) return false;
  const limits = getLimits(billing.plan);
  return currentHomeCount < limits.maxHomes;
};

export const canInviteUser = ({ billing, currentUserCount }: { billing: Billing; currentUserCount: number }) => {
  if (!isBillingActive(billing)) return false;
  const limits = getLimits(billing.plan);
  return currentUserCount < limits.maxUsers;
};

export const canStartInspection = ({ billing }: { billing: Billing }) => isBillingActive(billing);
export const canGenerateReport = ({ billing }: { billing: Billing }) => isBillingActive(billing);
