import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type OnboardingDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: OnboardingDatabase) {
  return database ?? prisma;
}

class OnboardingRepository extends BaseRepository<typeof prisma.onboardingFlow> {
  findFlow<T extends Prisma.OnboardingFlowFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.OnboardingFlowFindUniqueArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).onboardingFlow.findUnique(args);
  }

  upsertCompletion<T extends Prisma.UserOnboardingCompletionUpsertArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserOnboardingCompletionUpsertArgs>,
    database?: OnboardingDatabase
  ) {
    return getDatabase(database).userOnboardingCompletion.upsert(args);
  }
}

export const onboardingRepository = new OnboardingRepository(prisma.onboardingFlow);

