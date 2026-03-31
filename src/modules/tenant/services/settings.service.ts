import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

export async function getTenantSettingsService(tenantId: string) {
  return tenantModuleRepository.findTenantUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logoUrl: true, commissionRate: true },
  });
}

export async function updateTenantSettingsService(
  tenantId: string,
  data: { name: string; phone?: string; email?: string; address?: string; logoUrl?: string; commissionRate?: number }
) {
  return tenantModuleRepository.updateTenant({ where: { id: tenantId }, data });
}

