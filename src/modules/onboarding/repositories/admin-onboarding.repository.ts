import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type OnboardingDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: OnboardingDatabase) {
  return database ?? prisma;
}

class OnboardingRepository extends BaseRepository<typeof prisma.onboardingFlow> {
  findFlows<T extends Prisma.OnboardingFlowFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowFindManyArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.findMany(args);
  }

  findFlow<T extends Prisma.OnboardingFlowFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowFindUniqueArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.findUnique(args);
  }

  createFlow<T extends Prisma.OnboardingFlowCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowCreateArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.create(args);
  }

  updateFlow<T extends Prisma.OnboardingFlowUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowUpdateArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.update(args);
  }

  deleteFlow<T extends Prisma.OnboardingFlowDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowDeleteArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.delete(args);
  }

  findSteps<T extends Prisma.OnboardingStepFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingStepFindManyArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingStep.findMany(args);
  }

  createStep<T extends Prisma.OnboardingStepCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingStepCreateArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingStep.create(args);
  }

  updateStep<T extends Prisma.OnboardingStepUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingStepUpdateArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingStep.update(args);
  }

  deleteStep<T extends Prisma.OnboardingStepDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingStepDeleteArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingStep.delete(args);
  }

  findFlowPlanAccess<T extends Prisma.OnboardingFlowPlanFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowPlanFindManyArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlowPlan.findMany(args);
  }

  findPlans<T extends Prisma.PlanFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindManyArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).plan.findMany(args);
  }

  replaceFlowPlans(flowId: string, planIds: string[]) {
    return prisma.$transaction([
      prisma.onboardingFlowPlan.deleteMany({ where: { flowId } }),
      ...(planIds.length > 0
        ? [
            prisma.onboardingFlowPlan.createMany({
              data: planIds.map((planId) => ({ flowId, planId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  findFlowTenantOverrides<T extends Prisma.OnboardingFlowTenantFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowTenantFindManyArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlowTenant.findMany(args);
  }

  upsertFlowTenantOverride<T extends Prisma.OnboardingFlowTenantUpsertArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowTenantUpsertArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlowTenant.upsert(args);
  }

  deleteFlowTenantOverride<T extends Prisma.OnboardingFlowTenantDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowTenantDeleteArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlowTenant.delete(args);
  }
}

export const onboardingRepository = new OnboardingRepository(prisma.onboardingFlow);




