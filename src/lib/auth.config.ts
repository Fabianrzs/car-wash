import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export default {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenantUsers: {
              where: { isActive: true },
              include: { tenant: { select: { slug: true } } },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        });
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        const tenantSlug = user.tenantUsers[0]?.tenant?.slug || undefined;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          globalRole: user.globalRole,
          tenantSlug,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
