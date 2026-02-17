import { prisma } from "@/lib/prisma";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Asocia todos los SUPER_ADMIN como ADMIN en un tenant.
 * Usa createMany + skipDuplicates para evitar errores si ya existen.
 */
export async function associateSuperAdminsWithTenant(
  tenantId: string,
  tx?: TransactionClient
) {
  const db = tx || prisma;

  const superAdmins = await db.user.findMany({
    where: { globalRole: "SUPER_ADMIN" },
    select: { id: true },
  });

  if (superAdmins.length === 0) return;

  await db.tenantUser.createMany({
    data: superAdmins.map((admin) => ({
      userId: admin.id,
      tenantId,
      role: "ADMIN" as const,
    })),
    skipDuplicates: true,
  });
}
