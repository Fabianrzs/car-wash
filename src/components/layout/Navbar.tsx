"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Shield, Building2, X } from "lucide-react";
import Link from "next/link";
import { getSelectedTenant, clearSelectedTenant } from "@/lib/tenant-cookie";
import ThemeToggle from "@/components/ui/ThemeToggle";

const pageTitles: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/clients":       "Clientes",
  "/vehicles":      "Vehículos",
  "/services":      "Servicios",
  "/orders":        "Órdenes",
  "/mis-ordenes":   "Mis Órdenes",
  "/reports":       "Reportes",
  "/settings":      "Ajustes",
  "/team":          "Equipo",
  "/billing":       "Facturación",
  "/admin":         "Admin",
  "/admin/tenants": "Tenants",
  "/admin/plans":   "Planes",
  "/admin/users":   "Usuarios",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "Dashboard";
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.globalRole === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSuperAdmin) return;
    const slug = getSelectedTenant();
    if (slug) setTenantSlug(slug);
  }, [isSuperAdmin]);

  const handleChangeTenant = () => {
    clearSelectedTenant();
    window.location.reload();
  };

  const handleSignOut = () => {
    clearSelectedTenant();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    signOut({ callbackUrl: "/login" });
  };

  const displayName = session?.user?.name || session?.user?.email || "";
  const firstName = displayName.split(" ")[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 md:px-6">
      <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h1>

      <div className="flex items-center gap-1.5">
        {/* Tenant badge for super admin */}
        {isSuperAdmin && tenantSlug && !pathname?.startsWith("/admin") && (
          <span className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/25 dark:text-violet-400">
            <Building2 className="h-3 w-3" />
            {tenantSlug}
            <button
              type="button"
              onClick={handleChangeTenant}
              className="ml-0.5 rounded p-0.5 hover:bg-violet-100 dark:hover:bg-violet-900/50"
              title="Cambiar lavadero"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}

        {/* Admin link */}
        {isSuperAdmin && !pathname?.startsWith("/admin") && (
          <Link
            href="/admin"
            className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/25 dark:text-violet-400 dark:hover:bg-violet-900/40"
          >
            <Shield className="h-3 w-3" />
            Admin
          </Link>
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Separator */}
        <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-[11px] font-semibold text-white">
            {getInitials(session?.user?.name)}
          </div>
          {firstName && (
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
              {firstName}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
