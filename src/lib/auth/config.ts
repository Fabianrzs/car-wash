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
        const isProduction = process.env.NODE_ENV === "production";

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
            const errorMsg = err instanceof Error ? err.message : String(err);
            if (isProduction) {
              console.error("[auth] employee authorize error:", { tenantSlug, employeeCode, error: errorMsg });
            } else {
              console.error("[auth] employee authorize error:", err);
            }
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
        // Temporalmente disabled en Vercel para diagnosticar
        if (process.env.NODE_ENV === "production") {
          // Skip rate limit check in production to diagnose issue
        } else if (!rl.allowed) {
          return null;
        }

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
          
          if (!user) {
            if (isProduction) {
              console.warn("[auth] user not found:", { email });
            }
            return null;
          }
          
          if (!user.password) {
            if (isProduction) {
              console.warn("[auth] user has no password:", { email });
            }
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            if (isProduction) {
              console.warn("[auth] password mismatch:", { email });
            }
            return null;
          }

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
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (isProduction) {
            console.error("[auth] authorize error:", { email, error: errorMsg });
          } else {
            console.error("[auth] authorize error:", err);
          }
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
