import {requireActivePlan} from "@/lib";

export async function ensureActivePlan(
  tenantId: string,
  globalRole?: string,
  tenant?: {
    id: string;
    isActive: boolean;
    trialEndsAt: Date | null;
    planId: string | null;
    stripeSubscriptionId: string | null;
    plan: { id: string; name: string; price: unknown } | null;
  }
) {
  return requireActivePlan(tenantId, globalRole, tenant);
}

