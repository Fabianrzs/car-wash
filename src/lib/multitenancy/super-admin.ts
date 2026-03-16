import { type TransactionClient } from "@/repositories/transaction.repository";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

/**
 * Asocia todos los SUPER_ADMIN como ADMIN en un tenant.
 * Usa createMany + skipDuplicates para evitar errores si ya existen.
 */
export async function associateSuperAdminsWithTenant(
    tenantId: string,
    tx?: TransactionClient
) {
    const superAdmins = await tenantModuleRepository.findManyUsers({
        where: { globalRole: "SUPER_ADMIN" },
        select: { id: true },
    }, tx);

    if (superAdmins.length === 0) return;

    await tenantModuleRepository.createManyTenantUsers({
        data: superAdmins.map((admin) => ({
            userId: admin.id,
            tenantId,
            role: "ADMIN" as const,
        })),
        skipDuplicates: true,
    }, tx);
}
