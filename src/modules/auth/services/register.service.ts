import bcrypt from "bcryptjs";
import { prisma } from "@/database/prisma";
import { associateSuperAdminsWithTenant } from "@/lib/multitenancy";
import { sendWelcomeEmail } from "@/lib/email";
import type { RegisterInput } from "@/modules/auth/validations/auth.validation";

export async function registerUserService(data: RegisterInput) {
  let planId: string | null = null;
  let isTrial = false;
  if (data.planSlug) {
    const plan = await prisma.plan.findUnique({ where: { slug: data.planSlug } });
    if (plan) { planId = plan.id; isTrial = Number(plan.price) === 0; }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword },
    });
    const tenant = await tx.tenant.create({
      data: {
        name: data.businessName,
        slug: data.businessSlug,
        ...(planId ? { plan: { connect: { id: planId } } } : {}),
        trialEndsAt: isTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });
    await tx.tenantUser.create({
      data: { user: { connect: { id: user.id } }, tenant: { connect: { id: tenant.id } }, role: "OWNER" },
    });
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
  const invitation = await prisma.invitation.findUnique({
    where: { token: data.token },
    select: { id: true, email: true, role: true, tenantId: true, acceptedAt: true, expiresAt: true },
  });

  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.acceptedAt) throw new Error("Esta invitación ya fue aceptada");
  if (invitation.expiresAt < new Date()) throw new Error("Esta invitación ha expirado");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Ya existe una cuenta con ese email");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        password: hashedPassword,
        tenantUsers: { create: { tenantId: invitation.tenantId, role: invitation.role } },
      },
    }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
  ]);
}

