import { userTenantsRepository } from "@/modules/user/repositories/user-tenants.repository";

export async function getUserTenantsService(userId: string) {
  const tenantUsers = await userTenantsRepository.findManyTenantUsers({
    where: { userId, isActive: true },
    include: { tenant: { select: { id: true, name: true, slug: true, isActive: true } } },
    orderBy: { createdAt: "asc" },
  });
  return tenantUsers.map((tu) => tu.tenant).filter((t) => t.isActive);
}

