import bcrypt from "bcryptjs";
import { associateSuperAdminsWithTenant } from "@/lib/multitenancy";
import { sendWelcomeEmail } from "@/lib/email";
import { authRepository } from "@/modules/auth/repositories/auth.repository";
import type { RegisterInput } from "@/modules/auth/validations/auth.validation";

export async function registerUserService(data: RegisterInput) {
  let planId: string | null = null;
  let isTrial = false;
  if (data.planSlug) {
    const plan = await authRepository.findPlanBySlug({ where: { slug: data.planSlug } });
    if (plan) { planId = plan.id; isTrial = Number(plan.price) === 0; }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await authRepository.transaction(async (tx) => {
    const user = await authRepository.createUser({
      data: { name: data.name, email: data.email, password: hashedPassword },
    }, tx);
    const tenant = await authRepository.createTenant({
      data: {
        name: data.businessName,
        slug: data.businessSlug,
        ...(planId ? { plan: { connect: { id: planId } } } : {}),
        trialEndsAt: isTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    }, tx);
    await authRepository.createTenantUser({
      data: { user: { connect: { id: user.id } }, tenant: { connect: { id: tenant.id } }, role: "OWNER" },
    }, tx);
    await associateSuperAdminsWithTenant(tenant.id, tx);
    return { user, tenant };
  });

  sendWelcomeEmail(result.user.email, result.user.name ?? "", result.tenant.name, result.tenant.slug)
    .catch((err) => console.error("Error sending welcome email:", err));

  return result;
}

export async function registerInviteUserService(data: {
  name: string;
  email: string;
  password: string;
  token: string;
}) {
  const invitation = await authRepository.findInvitationByToken({
    where: { token: data.token },
    select: { id: true, email: true, role: true, tenantId: true, acceptedAt: true, expiresAt: true },
  });

  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.acceptedAt) throw new Error("Esta invitación ya fue aceptada");
  if (invitation.expiresAt < new Date()) throw new Error("Esta invitación ha expirado");

  const existing = await authRepository.findUserByEmail({ where: { email: data.email } });
  if (existing) throw new Error("Ya existe una cuenta con ese email");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await authRepository.createInvitedUserAndAcceptInvitation({
    name: data.name.trim(),
    email: data.email,
    password: hashedPassword,
    tenantId: invitation.tenantId,
    role: invitation.role,
    invitationId: invitation.id,
    acceptedAt: new Date(),
  });
}

