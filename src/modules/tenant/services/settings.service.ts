import { prisma } from "@/database/prisma";

export async function getTenantSettingsService(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logoUrl: true },
  });
}

export async function updateTenantSettingsService(
  tenantId: string,
  data: { name: string; phone?: string; email?: string; address?: string; logoUrl?: string }
) {
  return prisma.tenant.update({ where: { id: tenantId }, data });
}

