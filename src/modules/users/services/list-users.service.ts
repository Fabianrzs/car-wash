import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { userRepository } from "@/modules/users/repositories/user.repository";

interface ListAdminUsersServiceInput {
  page: number;
  search: string;
}

export async function listAdminUsersService({ page, search }: ListAdminUsersServiceInput) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    userRepository.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        createdAt: true,
        tenantUsers: {
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    userRepository.count({ where }),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}


