import { requireTenant } from "@/lib";
import { onboardingRepository } from "@/modules/onboarding/repositories/onboarding.repository";

interface GetOnboardingFlowInput {
  key: string;
  userId: string;
  globalRole?: string;
  requestHeaders?: Headers;
}

export async function getOnboardingFlowService({
  key,
  userId,
  globalRole,
  requestHeaders,
}: GetOnboardingFlowInput) {
  const flow = await onboardingRepository.findFlow({
    where: { key },
    include: {
      steps: { orderBy: { order: "asc" } },
      planAccess: true,
      tenantOverrides: true,
      completions: { where: { userId } },
    },
  });

  if (!flow || !flow.isActive) {
    return null;
  }

  if (flow.completions.length > 0) {
    return { completed: true as const };
  }

  if (globalRole === "SUPER_ADMIN") {
    return { flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } };
  }

  let tenantId: string | null = null;
  let tenantPlanId: string | null = null;

  try {
    const tenantData = await requireTenant(requestHeaders);
    tenantId = tenantData.tenantId;
    tenantPlanId = tenantData.tenant.planId ?? null;
  } catch {
    // Intentionally ignore missing tenant context.
  }

  if (tenantId) {
    const tenantOverride = flow.tenantOverrides.find((override) => override.tenantId === tenantId);
    if (tenantOverride) {
      if (!tenantOverride.isEnabled) {
        return null;
      }
      return { flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } };
    }

    if (flow.planAccess.length > 0) {
      const hasAccess = Boolean(tenantPlanId && flow.planAccess.some((item) => item.planId === tenantPlanId));
      if (!hasAccess) {
        return null;
      }
    }
  }

  return { flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } };
}

export async function completeOnboardingFlowService(key: string, userId: string) {
  const flow = await onboardingRepository.findFlow({ where: { key } });

  if (!flow) {
    return null;
  }

  await onboardingRepository.upsertCompletion({
    where: { userId_flowId: { userId, flowId: flow.id } },
    create: { userId, flowId: flow.id },
    update: {},
  });

  return { success: true };
}

