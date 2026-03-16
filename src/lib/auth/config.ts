import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/database/prisma";
import {checkRateLimit} from "@/lib/security/rate-limit";

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

        // Rate limit: 5 login attempts per email per 15 minutes
        const rl = checkRateLimit(`login:${email.toLowerCase()}`, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.allowed) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              tenantUsers: {
                where: { isActive: true },
                include: { tenant: { select: { slug: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
          });
          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          // Only embed tenantSlug in JWT for single-tenant users.
          // Multi-tenant users will select via TenantGuard → cookie.
          const activeTenants = user.tenantUsers;
          const tenantSlug =
            activeTenants.length === 1
              ? activeTenants[0].tenant.slug
              : undefined;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            globalRole: user.globalRole,
            tenantSlug,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;

