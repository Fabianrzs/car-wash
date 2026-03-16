import crypto from "crypto";
import { $Enums } from "@/generated/prisma/client";
import { sendInvitationEmail } from "@/lib/email";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

export async function getTeamMembersService(tenantId: string) {
  return tenantModuleRepository.findManyTenantUsers({
    where: { tenantId, user: { globalRole: "USER" } },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function inviteTeamMemberService(
  tenantId: string,
  inviterId: string,
  inviterName: string,
  email: string,
  role: "ADMIN" | "EMPLOYEE" = "EMPLOYEE"
): Promise<{ invitation: object; emailError: string | null }> {
  const existingUser = await tenantModuleRepository.findUserUnique({ where: { email } });
  if (existingUser) {
    const member = await tenantModuleRepository.findTenantUserUnique({
      where: { userId_tenantId: { userId: existingUser.id, tenantId } },
    });
    if (member) throw new Error("El usuario ya es miembro");
  }

  const existingInv = await tenantModuleRepository.findInvitationFirst({
    where: { email, tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInv) throw new Error("Ya hay una invitación pendiente para este email");

  const token = crypto.randomBytes(32).toString("hex");
  const invitation = await tenantModuleRepository.createInvitation({
    data: {
      email,
      tenant: { connect: { id: tenantId } },
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: { connect: { id: inviterId } },
    },
    include: { tenant: { select: { name: true } } },
  });

  let emailError: string | null = null;
  try {
    await sendInvitationEmail(email, inviterName, invitation.tenant.name, token, invitation.role);
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Error desconocido al enviar el correo";
  }

  return { invitation, emailError };
}

export async function updateTeamMemberRoleService(tenantId: string, tenantUserId: string, role: string) {
  const target = await tenantModuleRepository.findTenantUserUnique({ where: { id: tenantUserId } });
  if (!target || target.tenantId !== tenantId) throw new Error("Miembro no encontrado");
  if (target.role === "OWNER") throw new Error("No se puede cambiar el rol del propietario");
  return tenantModuleRepository.updateTenantUser({
    where: { id: tenantUserId },
    data: { role: role as $Enums.TenantRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeTeamMemberService(tenantId: string, tenantUserId: string) {
  const target = await tenantModuleRepository.findTenantUserUnique({ where: { id: tenantUserId } });
  if (!target || target.tenantId !== tenantId) throw new Error("Miembro no encontrado");
  if (target.role === "OWNER") throw new Error("No se puede remover al propietario");
  await tenantModuleRepository.deleteTenantUser({ where: { id: tenantUserId } });
}

export async function deactivateTeamMemberService(tenantId: string, tenantUserId: string) {
  const target = await tenantModuleRepository.findTenantUserFirst({
    where: { id: tenantUserId, tenantId },
    select: { id: true, role: true },
  });

  if (!target) throw new Error("Miembro no encontrado");
  if (target.role === "OWNER") throw new Error("No se puede remover al propietario");

  await tenantModuleRepository.updateTenantUser({
    where: { id: tenantUserId },
    data: { isActive: false },
  });

  return { message: "Miembro removido correctamente" };
}



