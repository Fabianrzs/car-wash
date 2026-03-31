import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AuthDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: AuthDatabase) {
  return database ?? prisma;
}

class AuthRepository {
  transaction<T>(callback: (database: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  findUserByEmail<T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).user.findUnique(args);
  }

  createUser<T extends Prisma.UserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).user.create(args);
  }

  findTenantBySlug<T extends Prisma.TenantFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindUniqueArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).tenant.findUnique(args);
  }

  createTenant<T extends Prisma.TenantCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantCreateArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).tenant.create(args);
  }

  createTenantUser<T extends Prisma.TenantUserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserCreateArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).tenantUser.create(args);
  }

  findPlanBySlug<T extends Prisma.PlanFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindUniqueArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).plan.findUnique(args);
  }

  findTenantUserByEmployeeCode(
    tenantId: string,
    employeeCode: string,
    database?: AuthDatabase
  ) {
    return getDatabase(database).tenantUser.findFirst({
      where: { tenantId, employeeCode, isActive: true },
      include: { user: true },
    });
  }

  findInvitationByToken<T extends Prisma.InvitationFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationFindUniqueArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).invitation.findUnique(args);
  }

  updateInvitation<T extends Prisma.InvitationUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationUpdateArgs>,
    database?: AuthDatabase
  ) {
    return getDatabase(database).invitation.update(args);
  }

  createInvitedUserAndAcceptInvitation(
    data: {
      name: string;
      email: string;
      password: string;
      tenantId: string;
      role: Prisma.TenantUserCreateWithoutTenantInput["role"];
      invitationId: string;
      acceptedAt: Date;
    },
    database?: AuthDatabase
  ) {
    const db = getDatabase(database);

    if ("$transaction" in db) {
      return db.$transaction([
        db.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: data.password,
            tenantUsers: {
              create: {
                tenantId: data.tenantId,
                role: data.role,
              },
            },
          },
        }),
        db.invitation.update({
          where: { id: data.invitationId },
          data: { acceptedAt: data.acceptedAt },
        }),
      ]);
    }

    return Promise.all([
      db.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          tenantUsers: {
            create: {
              tenantId: data.tenantId,
              role: data.role,
            },
          },
        },
      }),
      db.invitation.update({
        where: { id: data.invitationId },
        data: { acceptedAt: data.acceptedAt },
      }),
    ]);
  }
}

export const authRepository = new AuthRepository();

