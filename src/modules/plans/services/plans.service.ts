import {
  type CreatePlanInput,
  type UpdatePlanInput,
} from "@/modules/plans/validations/plan.validation";
import { PlanModuleError } from "@/modules/plans/plan.errors";
import { planRepository } from "@/modules/plans/repositories/plan.repository";

export async function listPublicPlansService() {
  return planRepository.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      interval: true,
      maxUsers: true,
      maxOrdersPerMonth: true,
      features: true,
    },
    orderBy: { price: "asc" },
  });
}

export async function listAdminPlansService() {
  return planRepository.findMany({
    include: {
      _count: { select: { tenants: true } },
    },
    orderBy: { price: "asc" },
  });
}

export async function createPlanService(data: CreatePlanInput) {
  const existingPlan = await planRepository.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existingPlan) {
    throw new PlanModuleError("El slug ya esta en uso", 400);
  }

  return planRepository.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      interval: data.interval,
      maxUsers: data.maxUsers,
      maxOrdersPerMonth: data.maxOrdersPerMonth,
      stripePriceId: data.stripePriceId || null,
      features: data.features,
    },
  });
}

export async function getAdminPlanByIdService(id: string) {
  const plan = await planRepository.findUnique({
    where: { id },
    include: {
      _count: { select: { tenants: true } },
    },
  });

  if (!plan) {
    throw new PlanModuleError("Plan no encontrado", 404);
  }

  return plan;
}

export async function updatePlanService(id: string, data: UpdatePlanInput) {
  return planRepository.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.interval !== undefined ? { interval: data.interval } : {}),
      ...(data.maxUsers !== undefined ? { maxUsers: data.maxUsers } : {}),
      ...(data.maxOrdersPerMonth !== undefined
        ? { maxOrdersPerMonth: data.maxOrdersPerMonth }
        : {}),
      ...(data.stripePriceId !== undefined
        ? { stripePriceId: data.stripePriceId || null }
        : {}),
      ...(data.features !== undefined ? { features: data.features } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

