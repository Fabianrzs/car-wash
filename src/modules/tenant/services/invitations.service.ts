import { prisma } from "@/database/prisma";

export async function getInvitationsService(tenantId: string) {
  return prisma.invitation.findMany({
    where: { tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitationService(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    select: { id: true, email: true, role: true, tenantId: true, acceptedAt: true, expiresAt: true, tenant: { select: { name: true, slug: true } } },
  });
}

