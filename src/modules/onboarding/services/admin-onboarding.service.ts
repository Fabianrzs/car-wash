import { onboardingRepository } from "@/modules/onboarding/repositories/admin-onboarding.repository";
import { OnboardingError } from "@/modules/onboarding/admin-onboarding.errors";

export async function listFlowsService() {
  return onboardingRepository.findFlows({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { steps: true, completions: true } },
    },
  });
}

export async function createFlowService(data: { key: string; title: string; description?: string | null }) {
  return onboardingRepository.createFlow({
    data: {
      key: data.key,
      title: data.title,
      description: data.description || null,
    },
  });
}

export async function getFlowDetailService(id: string) {
  const flow = await onboardingRepository.findFlow({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" } },
      planAccess: { include: { plan: { select: { id: true, name: true, slug: true } } } },
      tenantOverrides: { include: { tenant: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { completions: true } },
    },
  });

  if (!flow) {
    throw new OnboardingError("Flow no encontrado", 404);
  }

  return flow;
}

export async function updateFlowService(
  id: string,
  data: { title?: string; description?: string | null; isActive?: boolean }
) {
  return onboardingRepository.updateFlow({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteFlowService(id: string) {
  await onboardingRepository.deleteFlow({ where: { id } });
  return { success: true };
}

export async function listFlowStepsService(flowId: string) {
  return onboardingRepository.findSteps({
    where: { flowId },
    orderBy: { order: "asc" },
  });
}

export async function createFlowStepService(
  flowId: string,
  data: { title: string; description?: string | null; target: string; placement?: string; order?: number }
) {
  return onboardingRepository.createStep({
    data: {
      flowId,
      title: data.title,
      description: data.description || null,
      target: data.target,
      placement: data.placement || "bottom",
      order: data.order ?? 0,
    },
  });
}

export async function updateFlowStepService(
  stepId: string,
  data: { title?: string; description?: string | null; target?: string; placement?: string; order?: number }
) {
  return onboardingRepository.updateStep({
    where: { id: stepId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.target !== undefined ? { target: data.target } : {}),
      ...(data.placement !== undefined ? { placement: data.placement } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });
}

export async function deleteFlowStepService(stepId: string) {
  await onboardingRepository.deleteStep({ where: { id: stepId } });
  return { success: true };
}

export async function getFlowPlansService(flowId: string) {
  const [planAccess, allPlans] = await Promise.all([
    onboardingRepository.findFlowPlanAccess({ where: { flowId } }),
    onboardingRepository.findPlans({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    allPlans,
    selectedPlanIds: planAccess.map((entry) => entry.planId),
  };
}

export async function replaceFlowPlansService(flowId: string, planIds: string[]) {
  await onboardingRepository.replaceFlowPlans(flowId, planIds);
  return { success: true };
}

export async function listFlowTenantOverridesService(flowId: string) {
  return onboardingRepository.findFlowTenantOverrides({
    where: { flowId },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });
}

export async function upsertFlowTenantOverrideService(
  flowId: string,
  data: { tenantId: string; isEnabled?: boolean }
) {
  return onboardingRepository.upsertFlowTenantOverride({
    where: { flowId_tenantId: { flowId, tenantId: data.tenantId } },
    create: { flowId, tenantId: data.tenantId, isEnabled: data.isEnabled ?? true },
    update: { isEnabled: data.isEnabled ?? true },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });
}

export async function deleteFlowTenantOverrideService(flowId: string, tenantId: string) {
  await onboardingRepository.deleteFlowTenantOverride({
    where: { flowId_tenantId: { flowId, tenantId } },
  });

  return { success: true };
}



