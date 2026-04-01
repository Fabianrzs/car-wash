import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {checkRateLimit} from "@/lib/security/rate-limit";
import { authRepository } from "@/modules/auth/repositories/auth.repository";

export default {
  providers: [
    Credentials({
      credentials: {
        email:        { label: "Email",         type: "email" },
        password:     { label: "Password",      type: "password" },
        mode:         { label: "Mode",          type: "text" },
        tenantSlug:   { label: "Tenant Slug",   type: "text" },
        employeeCode: { label: "Employee Code", type: "text" },
        pin:          { label: "PIN",           type: "password" },
      },
      async authorize(credentials) {
        const mode = (credentials?.mode as string) || "email";

        // ── Employee PIN login ──────────────────────────────────────────
        if (mode === "employee") {
          const tenantSlug = (credentials?.tenantSlug as string | undefined)?.trim().toLowerCase() ?? "";
          const employeeCode = (credentials?.employeeCode as string | undefined)?.trim().toLowerCase() ?? "";
          const pin          = credentials?.pin as string;

          if (!tenantSlug || !employeeCode || !pin) return null;

          const rl = checkRateLimit(`login_employee:${tenantSlug}:${employeeCode}`, {
            limit: 5,
            windowMs: 15 * 60 * 1000,
          });
          if (!rl.allowed) return null;

          try {
            const tenant = await authRepository.findTenantBySlug({
              where: { slug: tenantSlug },
              select: { id: true, slug: true },
            });
            if (!tenant) return null;

            const tenantUser = await authRepository.findTenantUserByEmployeeCode(
              tenant.id,
              employeeCode
            );
            if (!tenantUser || !tenantUser.employeePin) return null;

            const pinMatch = await bcrypt.compare(pin, tenantUser.employeePin);
            if (!pinMatch) return null;

            const { user } = tenantUser;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              globalRole: user.globalRole,
              tenantSlug: tenant.slug,
            };
          } catch (err) {
            console.error("[auth] employee authorize error:", err);
            return null;
          }
        }

        // ── Email + password login ──────────────────────────────────────
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase() ?? "";
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const rl = checkRateLimit(`login:${email}`, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.allowed) return null;

        try {
          const user = await authRepository.findUserByEmail({
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

          const activeTenants = user.tenantUsers;
          const firstActiveTenant = activeTenants.at(0);
          const tenantSlug =
            activeTenants.length === 1 && firstActiveTenant
              ? firstActiveTenant.tenant.slug
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
