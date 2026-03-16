import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/database/prisma";
import { registerSchema } from "@/lib/validations";
import { associateSuperAdminsWithTenant } from "@/lib/multitenancy";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Rate limit: 10 registration attempts per IP per hour
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en una hora." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check email not taken
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 400 }
      );
    }

    // Check slug available
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.businessSlug },
    });
    if (existingTenant) {
      return NextResponse.json(
        { error: "El slug del lavadero ya esta en uso" },
        { status: 400 }
      );
    }

    // Find plan
    let planId: string | null = null;
    let isTrial = false;
    if (validatedData.planSlug) {
      const plan = await prisma.plan.findUnique({
        where: { slug: validatedData.planSlug },
      });
      if (plan) {
        planId = plan.id;
        isTrial = Number(plan.price) === 0;
      }
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create User + Tenant + TenantUser in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: validatedData.businessName,
          slug: validatedData.businessSlug,
          ...(planId ? { plan: { connect: { id: planId } } } : {}),
          trialEndsAt: isTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        },
      });

      await tx.tenantUser.create({
        data: {
          user: { connect: { id: user.id } },
          tenant: { connect: { id: tenant.id } },
          role: "OWNER",
        },
      });

      await associateSuperAdminsWithTenant(tenant.id, tx);

      return { user, tenant };
    });

    sendWelcomeEmail(
      result.user.email,
      result.user.name ?? "",
      result.tenant.name,
      result.tenant.slug
    ).catch((err) => console.error("Error sending welcome email:", err));

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de registro invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
