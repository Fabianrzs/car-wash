"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clientes",
  "/vehicles": "Vehiculos",
  "/services": "Servicios",
  "/orders": "Ordenes",
  "/reports": "Reportes",
  "/settings": "Ajustes",
  "/team": "Equipo",
  "/billing": "Facturacion",
  "/admin": "Admin",
  "/admin/tenants": "Tenants",
  "/admin/plans": "Planes",
  "/admin/users": "Usuarios",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";

  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return title;
    }
  }
  return "Dashboard";
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
        {title}
      </h1>

      <div className="flex items-center gap-2 md:gap-4">
        {session?.user?.globalRole === "SUPER_ADMIN" && !pathname?.startsWith("/admin") && (
          <Link
            href="/admin"
            className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}
        {session?.user && (
          <span className="hidden text-sm text-gray-600 sm:block">
            {session.user.name || session.user.email}
          </span>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesion</span>
        </button>
      </div>
    </header>
  );
}
