import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

export async function getInvitationsService(tenantId: string) {
  return tenantModuleRepository.findManyInvitations({
    where: { tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitationService(token: string) {
  return tenantModuleRepository.findInvitationUnique({
    where: { token },
    select: { id: true, email: true, role: true, tenantId: true, acceptedAt: true, expiresAt: true, tenant: { select: { name: true, slug: true } } },
  });
}

export async function acceptInvitationForUserService(token: string, userId: string) {
  const invitation = await tenantModuleRepository.findInvitationUnique({
    where: { token },
    select: {
      id: true,
      acceptedAt: true,
      expiresAt: true,
      tenantId: true,
      role: true,
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!invitation) throw new Error("Invitacion no encontrada");
  if (invitation.acceptedAt) throw new Error("Invitacion ya fue aceptada");
  if (invitation.expiresAt < new Date()) throw new Error("Invitacion expirada");

  const existingMember = await tenantModuleRepository.findTenantUserUnique({
    where: {
      userId_tenantId: { userId, tenantId: invitation.tenantId },
    },
    select: { id: true },
  });

  if (existingMember) {
    throw new Error("Ya eres miembro de este lavadero");
  }

  await tenantModuleRepository.transaction(async (tx) => {
    await tenantModuleRepository.createTenantUser({
      data: {
        user: { connect: { id: userId } },
        tenant: { connect: { id: invitation.tenantId } },
        role: invitation.role,
      },
    }, tx);

    await tenantModuleRepository.updateInvitation({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }, tx);
  });

  return {
    message: "Invitacion aceptada",
    tenant: {
      id: invitation.tenant.id,
      name: invitation.tenant.name,
      slug: invitation.tenant.slug,
    },
  };
}

