import { inviteRepository } from "@/modules/invite/repositories/invite.repository";

export async function getInvitationByTokenService(token: string) {
  const invitation = await inviteRepository.findInvitationByToken({
    where: { token },
    select: {
      id: true, email: true, role: true, expiresAt: true, acceptedAt: true,
      tenant: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.acceptedAt) throw new Error("Esta invitación ya fue aceptada");
  if (invitation.expiresAt < new Date()) throw new Error("Esta invitación ha expirado");

  return invitation;
}

