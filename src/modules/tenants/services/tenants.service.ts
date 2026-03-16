import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/prisma";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { associateSuperAdminsWithTenant } from "@/lib";
import { TenantsModuleError } from "@/modules/tenants/tenants.errors";
import { planRepository } from "@/modules/plans/repositories/plan.repository";
import { tenantRepository } from "@/modules/tenants/repositories/tenant.repository";
import { userRepository } from "@/modules/users/repositories/user.repository";

interface ListTenantsInput {
  page: number;
  search: string;
}

interface CreateTenantInput {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  planId?: string | null;
  ownerEmail?: string;
}

interface UpdateTenantInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  trialEndsAt?: string | null;
  planId?: string | null;
}

export async function listTenantsService({ page, search }: ListTenantsInput) {
  const where: Prisma.TenantWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [tenants, total] = await Promise.all([
    tenantRepository.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true } },
        _count: {
          select: { tenantUsers: true, serviceOrders: true, clients: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    tenantRepository.count({ where }),
  ]);

  return {
    tenants,
    total,
    pages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}

export async function createTenantService(data: CreateTenantInput) {
  const existingTenant = await tenantRepository.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existingTenant) {
    throw new TenantsModuleError("El slug ya esta en uso", 400);
  }

  let trialEndsAt: Date | null = null;
  if (data.planId) {
    const plan = await planRepository.findUnique({ where: { id: data.planId } });
    if (plan && Number(plan.price) === 0) {
      trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  return prisma.$transaction(async (tx) => {
    const tenant = await tenantRepository.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        trialEndsAt,
        ...(data.planId ? { plan: { connect: { id: data.planId } } } : {}),
      },
      include: { plan: true },
    }, tx);

    if (data.ownerEmail) {
      let user = await userRepository.findUnique({ where: { email: data.ownerEmail } }, tx);

      if (!user) {
        const tempPassword = randomBytes(16).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        user = await userRepository.create({
          data: {
            email: data.ownerEmail,
            name: data.ownerEmail.split("@")[0],
            password: hashedPassword,
          },
        }, tx);

        console.info(`[ADMIN] Created user for ${data.ownerEmail}. They must reset their password.`);
      }

      await tenantRepository.createTenantUser({
        data: {
          user: { connect: { id: user.id } },
          tenant: { connect: { id: tenant.id } },
          role: "OWNER",
        },
      }, tx);
    }

    await associateSuperAdminsWithTenant(tenant.id, tx);

    return tenant;
  });
}

export async function listTenantOptionsService(search: string) {
  const where: Prisma.TenantWhereInput = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const tenants = await tenantRepository.findMany({
    where,
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: 5,
  });

  return { tenants };
}

export async function getTenantByIdService(id: string) {
  const tenant = await tenantRepository.findUnique({
    where: { id },
    include: {
      plan: true,
      tenantUsers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: {
        select: { clients: true, serviceOrders: true, vehicles: true, serviceTypes: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          tax: true,
          totalAmount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
          periodStart: true,
          periodEnd: true,
          plan: { select: { name: true } },
        },
      },
    },
  });

  if (!tenant) {
    throw new TenantsModuleError("Tenant no encontrado", 404);
  }

  return tenant;
}

export async function updateTenantService(id: string, data: UpdateTenantInput) {
  let trialEndsAt: Date | null | undefined = undefined;

  if (data.trialEndsAt !== undefined) {
    trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
  } else if (data.planId !== undefined && data.planId) {
    const plan = await planRepository.findUnique({ where: { id: data.planId } });
    if (plan && Number(plan.price) === 0 && !plan.stripePriceId) {
      trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    }
  } else if (data.planId === null) {
    trialEndsAt = null;
  }

  return tenantRepository.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(trialEndsAt !== undefined ? { trialEndsAt } : {}),
      ...(data.planId !== undefined
        ? data.planId
          ? { plan: { connect: { id: data.planId } } }
          : { plan: { disconnect: true } }
        : {}),
    },
    include: { plan: true },
  });
}

export async function deactivateTenantService(id: string) {
  await tenantRepository.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: "Tenant desactivado correctamente" };
}



